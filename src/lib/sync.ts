import { useAuthStore } from '@/store/useAuthStore';
import { getDb, getSyncOwner, seedDefaultPartsIfEmpty, setSyncOwner, wipeLocalData } from './db';
import { supabase } from './supabase';

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

const later = (a: string, b: string) => new Date(a).getTime() > new Date(b).getTime();

let running = false;

/** 로그인 직후 앱 시작 시 호출하는 전체 동기화 */
export async function syncAll(userId: string) {
  if (running) return;
  running = true;
  try {
    const db = getDb();
    if (getSyncOwner() !== userId) {
      wipeLocalData(db);
      setSyncOwner(userId);
    }
    await pullMerge();
    const { n } = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM body_parts')!;
    if (n === 0) seedDefaultPartsIfEmpty(db); // 서버에도 없으면 신규 계정 — 기본 부위로 시작
    await pushUnsynced(userId);
  } finally {
    running = false;
  }
}

/** 쓰기 직후 호출 , 비로그인이면 건너뛰고, 실패해도 synced=0이 남아 다음 동기화에서 재시도 */
export function pushAfterWrite() {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  pushUnsynced(userId).catch((e) => console.warn('서버 반영 실패(다음 동기화에서 재시도)', e));
}

async function pullMerge() {
  // RLS가 내 행만 돌려주므로 user_id 필터는 생략
  // 목표(goals)는 기기 로컬 전용이라 여기서 다루지 않는다 — 로그아웃하면 사라짐
  const [partsRes, logsRes, logPartsRes] = await Promise.all([
    supabase.from('body_parts').select('id, name, sort_order, is_active, updated_at, deleted_at'),
    supabase
      .from('workout_logs')
      .select('id, log_date, duration_min, intensity, condition, memo, updated_at, deleted_at'),
    supabase.from('workout_log_parts').select('log_id, body_part_id, duration_min'),
  ]);
  const error = partsRes.error ?? logsRes.error ?? logPartsRes.error;
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
        // 같은 이름의 로컬 부위는 서버 id로 통일 — 기본 부위가 기기마다 다른 id로 시드되기 때문
        const byName = db.getFirstSync<{ id: string; updated_at: string }>(
          'SELECT id, updated_at FROM body_parts WHERE name = ?', sp.name,
        );
        if (byName) {
          db.runSync(
            'UPDATE OR REPLACE workout_log_parts SET body_part_id = ? WHERE body_part_id = ?',
            sp.id, byName.id,
          );
          db.runSync('UPDATE body_parts SET id = ? WHERE id = ?', sp.id, byName.id);
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
      // 로컬이 더 최신이면 그대로 두고 push에서 서버로 반영한다
    }

    for (const sl of serverLogs) {
      const local = db.getFirstSync<{ id: string; updated_at: string }>(
        'SELECT id, updated_at FROM workout_logs WHERE log_date = ?', sl.log_date,
      );
      if (local && local.id !== sl.id) {
        // 같은 날짜는 서버 id로 통일 — push 시 UNIQUE(user_id, log_date) 충돌을 막는다
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
        // push 도중 다시 수정된 행은 synced=0을 유지해야 하므로 updated_at까지 일치할 때만 마킹
        db.runSync('UPDATE body_parts SET synced = 1 WHERE id = ? AND updated_at = ?', p.id, p.updated_at);
      }
    });
  }

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

  // 부위 연결은 기록 단위로 서버 것을 지우고 로컬 것으로 갈아끼운다
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
