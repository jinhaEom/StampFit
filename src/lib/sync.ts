import { useAuthStore } from '@/store/useAuthStore';
import { getDb, getSyncOwner, seedDefaultPartsIfEmpty, setSyncOwner, wipeLocalData } from './db';
import { toast } from '@/lib/toast';
import { supabase } from './supabase';
import type { WorkoutCycleStep } from './types';

interface ServerPart {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
  deleted_at: string | null;
}

interface ServerLog {
  id: string;
  log_date: string;
  duration_min: number;
  intensity: number;
  condition: number;
  memo: string | null;
  updated_at: string;
  deleted_at: string | null;
}

interface ServerGoal {
  target_count: number;
  recurring: boolean;
  week_start: string;
  updated_at: string;
}

interface ServerCycle {
  steps: WorkoutCycleStep[];
  current_index: number;
  updated_at: string;
}

const later = (a: string, b: string) => new Date(a).getTime() > new Date(b).getTime();

let inFlight: Promise<void> | null = null; // 진행 중인 동기화 (중복 실행 방지)

/** 전체 동기화 (진행 중이면 그 작업을 같이 기다림) */
export function syncAll(userId: string): Promise<void> {
  if (!inFlight) {
    inFlight = runSync(userId).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function runSync(userId: string) {
  const db = getDb();
  if (getSyncOwner() !== userId) {
    wipeLocalData(db);
    setSyncOwner(userId);
  }
  try {
    await pullMerge();
  } finally {
    seedDefaultPartsIfEmpty(db);
  }
  await pushUnsynced(userId);
}

/** 로그인 직후 서버 기록 받기 (실패하면 2초 뒤 한 번 더, 그래도 실패면 토스트만 띄우고 진행) */
export async function syncAfterLogin(userId: string) {
  try {
    await syncAll(userId);
  } catch (e) {
    console.warn('로그인 후 동기화 실패, 재시도', e);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      await syncAll(userId);
    } catch (e2: any) {
      console.warn('로그인 후 동기화 재시도 실패', e2);
      toast.error('기록을 불러오지 못했어요', String(e2?.message ?? e2));
    }
  }
}

/** 서버에 안 올라간 데이터 수 (로그아웃 시 사라질 기록·목표·싸이클) */
export function countUnsynced(): number {
  const row = getDb().getFirstSync<{ n: number }>(
    `SELECT
       (SELECT COUNT(*) FROM workout_logs WHERE synced = 0 AND deleted_at IS NULL)
     + (SELECT COUNT(*) FROM goals WHERE synced = 0)
     + (SELECT COUNT(*) FROM goal_history WHERE synced = 0)
     + (SELECT COUNT(*) FROM workout_cycle WHERE synced = 0) AS n`,
  );
  return row?.n ?? 0;
}

/** 쓰기 직후 서버 반영 (pull 먼저 해서 같은 이름 부위 id 통일, 실패분은 다음 동기화에서 재시도) */
export function pushAfterWrite(): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return Promise.resolve();
  /* 진행 중이던 동기화에 묻힌 변경분까지 한 번 더 push */
  return syncAll(userId).then(() => pushUnsynced(userId)).catch((e) => {
    console.warn('서버 반영 실패(다음 동기화에서 재시도)', e);
    /* 개발 중엔 실패 원인까지 표시 */
    toast.error('서버에 저장하지 못했어요', __DEV__ ? String(e?.message ?? e) : '다음 동기화 때 다시 시도해요');
  });
}

async function pullMerge() {
  // 내 행만 옴 (RLS라 user_id 필터 생략)
  const [partsRes, logsRes, logPartsRes, goalRes, historyRes, cycleRes] = await Promise.all([
    supabase.from('body_parts').select('id, name, sort_order, is_active, updated_at, deleted_at'),
    supabase
      .from('workout_logs')
      .select('id, log_date, duration_min, intensity, condition, memo, updated_at, deleted_at'),
    supabase.from('workout_log_parts').select('log_id, body_part_id, duration_min'),
    supabase.from('goals').select('target_count, recurring, week_start, updated_at').maybeSingle(),
    supabase.from('goal_history').select('target_count, recurring, week_start, updated_at'),
    supabase.from('workout_cycle').select('steps, current_index, updated_at').maybeSingle(),
  ]);
  const error =
    partsRes.error ?? logsRes.error ?? logPartsRes.error ?? goalRes.error ?? historyRes.error ?? cycleRes.error;
  if (error) throw error;

  const serverParts = (partsRes.data ?? []) as ServerPart[];
  const serverLogs = (logsRes.data ?? []) as ServerLog[];
  const partsByLog = new Map<string, { body_part_id: string; duration_min: number }[]>();
  for (const row of logPartsRes.data ?? []) {
    const list = partsByLog.get(row.log_id) ?? [];
    list.push({ body_part_id: row.body_part_id, duration_min: row.duration_min });
    partsByLog.set(row.log_id, list);
  }

  const db = getDb();
  db.withTransactionSync(() => {
    for (const sp of serverParts) {
      let local = db.getFirstSync<{ id: string; updated_at: string }>(
        'SELECT id, updated_at FROM body_parts WHERE id = ?', sp.id,
      );
      if (!local) {
        // 같은 이름 로컬 부위 (기기마다 id가 달라 서버 id로 통일)
        const byName = db.getFirstSync<{ id: string; updated_at: string }>(
          'SELECT id, updated_at FROM body_parts WHERE name = ?', sp.name,
        );
        if (byName) {
          db.runSync(
            'UPDATE OR REPLACE workout_log_parts SET body_part_id = ? WHERE body_part_id = ?',
            sp.id, byName.id,
          );
          db.runSync('UPDATE body_parts SET id = ? WHERE id = ?', sp.id, byName.id);
          /* 싸이클 단계 속 부위 id도 교체 */
          db.runSync(
            `UPDATE workout_cycle SET steps_json = REPLACE(steps_json, ?, ?), synced = 0
             WHERE id = 1 AND instr(steps_json, ?) > 0`,
            byName.id, sp.id, byName.id,
          );
          local = { id: sp.id, updated_at: byName.updated_at };
        }
      }
      if (!local) {
        db.runSync(
          `INSERT INTO body_parts (id, name, sort_order, is_active, updated_at, deleted_at, synced)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          sp.id, sp.name, sp.sort_order, sp.is_active ? 1 : 0, sp.updated_at, sp.deleted_at,
        );
      } else if (later(sp.updated_at, local.updated_at)) {
        db.runSync(
          `UPDATE body_parts SET name = ?, sort_order = ?, is_active = ?, updated_at = ?, deleted_at = ?, synced = 1
           WHERE id = ?`,
          sp.name, sp.sort_order, sp.is_active ? 1 : 0, sp.updated_at, sp.deleted_at, sp.id,
        );
      }
      /* 로컬이 더 최신이면 그대로 (push에서 반영) */
    }

    for (const sl of serverLogs) {
      const local = db.getFirstSync<{ id: string; updated_at: string }>(
        'SELECT id, updated_at FROM workout_logs WHERE log_date = ?', sl.log_date,
      );
      if (local && local.id !== sl.id) {
        /* 같은 날짜는 서버 id로 통일 (push 시 UNIQUE 충돌 방지) */
        db.runSync('UPDATE OR REPLACE workout_log_parts SET log_id = ? WHERE log_id = ?', sl.id, local.id);
        db.runSync('UPDATE workout_logs SET id = ? WHERE id = ?', sl.id, local.id);
      }
      if (local && !later(sl.updated_at, local.updated_at)) continue;
      if (!local) {
        db.runSync(
          `INSERT INTO workout_logs (id, log_date, duration_min, intensity, condition, memo, updated_at, deleted_at, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          sl.id, sl.log_date, sl.duration_min, sl.intensity, sl.condition, sl.memo, sl.updated_at, sl.deleted_at,
        );
      } else {
        db.runSync(
          `UPDATE workout_logs
             SET duration_min = ?, intensity = ?, condition = ?, memo = ?, updated_at = ?, deleted_at = ?, synced = 1
           WHERE id = ?`,
          sl.duration_min, sl.intensity, sl.condition, sl.memo, sl.updated_at, sl.deleted_at, sl.id,
        );
      }
      db.runSync('DELETE FROM workout_log_parts WHERE log_id = ?', sl.id);
      for (const part of partsByLog.get(sl.id) ?? []) {
        db.runSync(
          'INSERT OR IGNORE INTO workout_log_parts (log_id, body_part_id, duration_min) VALUES (?, ?, ?)',
          sl.id, part.body_part_id, part.duration_min,
        );
      }
    }

    /* 목표·이력·싸이클 (서버가 더 최신일 때만 덮어씀) */
    const sg = goalRes.data as ServerGoal | null;
    if (sg) {
      const local = db.getFirstSync<{ updated_at: string }>('SELECT updated_at FROM goals WHERE id = 1');
      if (!local || later(sg.updated_at, local.updated_at)) {
        db.runSync(
          `INSERT OR REPLACE INTO goals (id, target_count, recurring, week_start, updated_at, synced)
           VALUES (1, ?, ?, ?, ?, 1)`,
          sg.target_count, sg.recurring ? 1 : 0, sg.week_start, sg.updated_at,
        );
      }
    }

    for (const sh of (historyRes.data ?? []) as ServerGoal[]) {
      const local = db.getFirstSync<{ updated_at: string }>(
        'SELECT updated_at FROM goal_history WHERE week_start = ?', sh.week_start,
      );
      if (!local || later(sh.updated_at, local.updated_at)) {
        db.runSync(
          `INSERT OR REPLACE INTO goal_history (week_start, target_count, recurring, updated_at, synced)
           VALUES (?, ?, ?, ?, 1)`,
          sh.week_start, sh.target_count, sh.recurring ? 1 : 0, sh.updated_at,
        );
      }
    }

    const sc = cycleRes.data as ServerCycle | null;
    if (sc) {
      const local = db.getFirstSync<{ updated_at: string }>('SELECT updated_at FROM workout_cycle WHERE id = 1');
      if (!local || later(sc.updated_at, local.updated_at)) {
        db.runSync(
          `INSERT OR REPLACE INTO workout_cycle (id, steps_json, current_index, updated_at, synced)
           VALUES (1, ?, ?, ?, 1)`,
          JSON.stringify(sc.steps), sc.current_index, sc.updated_at,
        );
      }
    }
  });
}

async function pushUnsynced(userId: string) {
  const db = getDb();

  const parts = db.getAllSync<{
    id: string; name: string; sort_order: number; is_active: number; updated_at: string; deleted_at: string | null;
  }>('SELECT id, name, sort_order, is_active, updated_at, deleted_at FROM body_parts WHERE synced = 0');
  if (parts.length > 0) {
    const { error } = await supabase.from('body_parts').upsert(
      parts.map((p) => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        sort_order: p.sort_order,
        is_active: p.is_active === 1,
        updated_at: p.updated_at,
        deleted_at: p.deleted_at,
      })),
    );
    if (error) throw error;
    db.withTransactionSync(() => {
      for (const p of parts) {
        /* updated_at까지 같을 때만 완료 표시 (push 중 수정된 행 보호) */
        db.runSync('UPDATE body_parts SET synced = 1 WHERE id = ? AND updated_at = ?', p.id, p.updated_at);
      }
    });
  }

  await pushGoalAndCycle(userId);

  const logs = db.getAllSync<{
    id: string; log_date: string; duration_min: number; intensity: number;
    condition: number; memo: string | null; updated_at: string; deleted_at: string | null;
  }>(
    'SELECT id, log_date, duration_min, intensity, condition, memo, updated_at, deleted_at FROM workout_logs WHERE synced = 0',
  );
  if (logs.length === 0) return;

  const { error: logError } = await supabase.from('workout_logs').upsert(
    logs.map((l) => ({
      id: l.id,
      user_id: userId,
      log_date: l.log_date,
      duration_min: l.duration_min,
      intensity: l.intensity,
      condition: l.condition,
      memo: l.memo,
      updated_at: l.updated_at,
      deleted_at: l.deleted_at,
    })),
  );
  if (logError) throw logError;

  /* 부위 연결은 기록 단위로 통째 교체 (서버 삭제 후 로컬 삽입) */
  const logIds = logs.map((l) => l.id);
  const junction = db.getAllSync<{ log_id: string; body_part_id: string; duration_min: number }>(
    `SELECT log_id, body_part_id, duration_min FROM workout_log_parts WHERE log_id IN (${logIds.map(() => '?').join(', ')})`,
    ...logIds,
  );
  const { error: delError } = await supabase.from('workout_log_parts').delete().in('log_id', logIds);
  if (delError) throw delError;
  if (junction.length > 0) {
    const { error: insError } = await supabase
      .from('workout_log_parts')
      .insert(junction.map((r) => ({ ...r, user_id: userId })));
    if (insError) throw insError;
  }

  db.withTransactionSync(() => {
    for (const l of logs) {
      db.runSync('UPDATE workout_logs SET synced = 1 WHERE id = ? AND updated_at = ?', l.id, l.updated_at);
    }
  });
}

/** 목표·목표 이력·싸이클 push */
async function pushGoalAndCycle(userId: string) {
  const db = getDb();

  const goal = db.getFirstSync<{ target_count: number; recurring: number; week_start: string; updated_at: string }>(
    'SELECT target_count, recurring, week_start, updated_at FROM goals WHERE id = 1 AND synced = 0',
  );
  if (goal) {
    const { error } = await supabase.from('goals').upsert({
      user_id: userId,
      target_count: goal.target_count,
      recurring: goal.recurring === 1,
      week_start: goal.week_start,
      updated_at: goal.updated_at,
    });
    if (error) throw error;
    db.runSync('UPDATE goals SET synced = 1 WHERE id = 1 AND updated_at = ?', goal.updated_at);
  }

  const history = db.getAllSync<{ target_count: number; recurring: number; week_start: string; updated_at: string }>(
    'SELECT target_count, recurring, week_start, updated_at FROM goal_history WHERE synced = 0',
  );
  if (history.length > 0) {
    const { error } = await supabase.from('goal_history').upsert(
      history.map((h) => ({
        user_id: userId,
        week_start: h.week_start,
        target_count: h.target_count,
        recurring: h.recurring === 1,
        updated_at: h.updated_at,
      })),
      { onConflict: 'user_id,week_start' },
    );
    if (error) throw error;
    db.withTransactionSync(() => {
      for (const h of history) {
        db.runSync(
          'UPDATE goal_history SET synced = 1 WHERE week_start = ? AND updated_at = ?', h.week_start, h.updated_at,
        );
      }
    });
  }

  const cycle = db.getFirstSync<{ steps_json: string; current_index: number; updated_at: string }>(
    'SELECT steps_json, current_index, updated_at FROM workout_cycle WHERE id = 1 AND synced = 0',
  );
  if (cycle) {
    const { error } = await supabase.from('workout_cycle').upsert({
      user_id: userId,
      steps: JSON.parse(cycle.steps_json),
      current_index: cycle.current_index,
      updated_at: cycle.updated_at,
    });
    if (error) throw error;
    db.runSync('UPDATE workout_cycle SET synced = 1 WHERE id = 1 AND updated_at = ?', cycle.updated_at);
  }
}
