import * as Crypto from 'expo-crypto';
import { todayStr, weekStart } from './date';
import { getDb, seedDefaultPartsIfEmpty, wipeLocalData } from './db';
import type { BodyPart, Goal, WorkoutCycle, WorkoutCycleStep, WorkoutLog, WorkoutLogPart } from './types';

/* 로컬 DB 읽기·쓰기 */

const nowIso = () => new Date().toISOString();

interface BodyPartRow {
  id: string;
  name: string;
  sort_order: number;
  is_active: number;
}

export function getBodyParts(): BodyPart[] {
  return getDb()
    .getAllSync<BodyPartRow>(
      'SELECT id, name, sort_order, is_active FROM body_parts WHERE deleted_at IS NULL ORDER BY sort_order, name',
    )
    .map((r) => ({ id: r.id, name: r.name, sortOrder: r.sort_order, isActive: r.is_active === 1 }));
}

/** 부위 id → 이름 (삭제된 부위 포함, 지난 기록 표시용) */
export function getBodyPartNamesById(): Record<string, string> {
  const rows = getDb().getAllSync<{ id: string; name: string }>('SELECT id, name FROM body_parts');
  return Object.fromEntries(rows.map((r) => [r.id, r.name]));
}

interface LogRow {
  id: string;
  log_date: string;
  duration_min: number;
  intensity: number;
  condition: number;
  memo: string | null;
}

/** 기록 전체 (삭제 제외, 날짜 오름차순) */
export function getLogs(): WorkoutLog[] {
  const db = getDb();
  const rows = db.getAllSync<LogRow>(
    'SELECT id, log_date, duration_min, intensity, condition, memo FROM workout_logs WHERE deleted_at IS NULL ORDER BY log_date',
  );
  const partRows = db.getAllSync<{ log_id: string; body_part_id: string; duration_min: number }>(
    'SELECT log_id, body_part_id, duration_min FROM workout_log_parts',
  );
  const partsByLog = new Map<string, WorkoutLogPart[]>();
  for (const p of partRows) {
    const list = partsByLog.get(p.log_id) ?? [];
    list.push({ id: p.body_part_id, durationMin: p.duration_min });
    partsByLog.set(p.log_id, list);
  }
  return rows.map((r) => ({
    id: r.id,
    logDate: r.log_date,
    durationMin: r.duration_min,
    intensity: r.intensity,
    condition: r.condition,
    memo: r.memo,
    parts: partsByLog.get(r.id) ?? [],
  }));
}

export interface UpsertLogInput {
  logDate: string;
  intensity: number;
  condition: number;
  memo: string | null;
  parts: WorkoutLogPart[];
}

export function upsertLog(input: UpsertLogInput) {
  const db = getDb();
  const now = nowIso();
  const durationMin = input.parts.reduce((sum, p) => sum + p.durationMin, 0);
  db.withTransactionSync(() => {
    const existing = db.getFirstSync<{ id: string }>(
      'SELECT id FROM workout_logs WHERE log_date = ?', input.logDate,
    );
    const id = existing?.id ?? Crypto.randomUUID();
    if (existing) {
      db.runSync(
        `UPDATE workout_logs
           SET duration_min = ?, intensity = ?, condition = ?, memo = ?,
               updated_at = ?, deleted_at = NULL, synced = 0
         WHERE id = ?`,
        durationMin, input.intensity, input.condition, input.memo, now, id,
      );
    } else {
      db.runSync(
        `INSERT INTO workout_logs (id, log_date, duration_min, intensity, condition, memo, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        id, input.logDate, durationMin, input.intensity, input.condition, input.memo, now,
      );
    }
    db.runSync('DELETE FROM workout_log_parts WHERE log_id = ?', id);
    for (const part of input.parts) {
      db.runSync(
        'INSERT INTO workout_log_parts (log_id, body_part_id, duration_min) VALUES (?, ?, ?)',
        id, part.id, part.durationMin,
      );
    }
    /* 새 기록일 때만 싸이클 다음 단계로 (수정 시 제외) */
    if (!existing) advanceCycleStep(db);
  });
}

/** 기록 소프트 삭제 (동기화로 삭제도 전파) */
export function softDeleteLog(logDate: string) {
  const now = nowIso();
  getDb().runSync(
    'UPDATE workout_logs SET deleted_at = ?, updated_at = ?, synced = 0 WHERE log_date = ?',
    now, now, logDate,
  );
}

/** 부위 추가 (성공 시 id, 중복이면 null, 삭제된 같은 이름은 복구) */
export function addBodyPart(name: string): string | null {
  const db = getDb();
  const dup = db.getFirstSync<{ id: string; deleted_at: string | null }>(
    'SELECT id, deleted_at FROM body_parts WHERE name = ?', name,
  );
  if (dup) {
    if (dup.deleted_at === null) return null;
    db.runSync(
      'UPDATE body_parts SET deleted_at = NULL, is_active = 1, updated_at = ?, synced = 0 WHERE id = ?',
      nowIso(), dup.id,
    );
    return dup.id;
  }
  const max = db.getFirstSync<{ m: number | null }>('SELECT MAX(sort_order) AS m FROM body_parts');
  const id = Crypto.randomUUID();
  db.runSync(
    'INSERT INTO body_parts (id, name, sort_order, is_active, updated_at, synced) VALUES (?, ?, ?, 1, ?, 0)',
    id, name, (max?.m ?? -1) + 1, nowIso(),
  );
  return id;
}

export function setBodyPartActive(id: string, active: boolean) {
  getDb().runSync(
    'UPDATE body_parts SET is_active = ?, updated_at = ?, synced = 0 WHERE id = ?',
    active ? 1 : 0, nowIso(), id,
  );
}

/** 부위 소프트 삭제 (지난 기록 연결 유지, 목록에서만 제외) */
export function deleteBodyPart(id: string) {
  const now = nowIso();
  getDb().runSync(
    'UPDATE body_parts SET deleted_at = ?, is_active = 0, updated_at = ?, synced = 0 WHERE id = ?',
    now, now, id,
  );
}

/** 부위 순서 저장 (받은 순서대로 재번호, 바뀐 행만) */
export function reorderBodyParts(ids: string[]) {
  const db = getDb();
  const now = nowIso();
  db.withTransactionSync(() => {
    ids.forEach((id, i) => {
      db.runSync(
        'UPDATE body_parts SET sort_order = ?, updated_at = ?, synced = 0 WHERE id = ? AND sort_order != ?',
        i, now, id, i,
      );
    });
  });
}

interface GoalRow { target_count: number; recurring: number; week_start: string }

export function getGoal(): Goal | null {
  const row = getDb().getFirstSync<GoalRow>(
    'SELECT target_count, recurring, week_start FROM goals WHERE id = 1',
  );
  if (!row) return null;
  return { targetCount: row.target_count, recurring: row.recurring === 1, weekStart: row.week_start };
}

/** 목표 변경 이력 (오래된 주부터, 주별 달성 판정용) */
export function getGoalHistory(): Goal[] {
  return getDb()
    .getAllSync<GoalRow>('SELECT target_count, recurring, week_start FROM goal_history ORDER BY week_start')
    .map((r) => ({ targetCount: r.target_count, recurring: r.recurring === 1, weekStart: r.week_start }));
}

/** 목표 저장 (이번 주 기준으로 다시 잡고 이력에도 기록) */
export function setGoal(targetCount: number, recurring: boolean) {
  const db = getDb();
  const ws = weekStart(todayStr());
  const now = nowIso();
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO goals (id, target_count, recurring, week_start, updated_at)
       VALUES (1, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         target_count = excluded.target_count, recurring = excluded.recurring,
         week_start = excluded.week_start, updated_at = excluded.updated_at`,
      targetCount, recurring ? 1 : 0, ws, now,
    );
    db.runSync(
      `INSERT INTO goal_history (week_start, target_count, recurring, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (week_start) DO UPDATE SET
         target_count = excluded.target_count, recurring = excluded.recurring,
         updated_at = excluded.updated_at`,
      ws, targetCount, recurring ? 1 : 0, now,
    );
  });
}

interface CycleRow { steps_json: string; current_index: number }

export function getCycle(): WorkoutCycle | null {
  const row = getDb().getFirstSync<CycleRow>('SELECT steps_json, current_index FROM workout_cycle WHERE id = 1');
  if (!row) return null;
  const steps: WorkoutCycleStep[] = JSON.parse(row.steps_json);
  if (steps.length === 0) return null;
  return { steps, currentIndex: row.current_index % steps.length };
}

/** 싸이클 단계 저장 */
export function setCycleSteps(steps: WorkoutCycleStep[]) {
  const db = getDb();
  const existing = db.getFirstSync<{ current_index: number }>(
    'SELECT current_index FROM workout_cycle WHERE id = 1',
  );
  const currentIndex = steps.length === 0 ? 0 : (existing?.current_index ?? 0) % steps.length;
  db.runSync(
    `INSERT INTO workout_cycle (id, steps_json, current_index, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       steps_json = excluded.steps_json, current_index = excluded.current_index, updated_at = excluded.updated_at`,
    JSON.stringify(steps), currentIndex, nowIso(),
  );
}

/** 싸이클 다음 단계로 (새 기록 저장 시) */
function advanceCycleStep(db: ReturnType<typeof getDb>) {
  const row = db.getFirstSync<CycleRow>('SELECT steps_json, current_index FROM workout_cycle WHERE id = 1');
  if (!row) return;
  const steps: WorkoutCycleStep[] = JSON.parse(row.steps_json);
  if (steps.length === 0) return;
  const nextIndex = (row.current_index + 1) % steps.length;
  db.runSync('UPDATE workout_cycle SET current_index = ?, updated_at = ? WHERE id = 1', nextIndex, nowIso());
}

/** 데이터 초기화 (전부 삭제 후 기본 부위 재삽입) */
export function resetAllData() {
  const db = getDb();
  wipeLocalData(db);
  seedDefaultPartsIfEmpty(db);
}
