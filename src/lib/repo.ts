import * as Crypto from 'expo-crypto';
import { todayStr, weekStart } from './date';
import { getDb, seedDefaultPartsIfEmpty, wipeLocalData } from './db';
import type { BodyPart, Goal, WorkoutCycle, WorkoutCycleStep, WorkoutLog, WorkoutLogPart } from './types';

/**
 * 로컬 DB CRUD.
 */

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

/** 삭제 여부와 무관하게 id ,이름. 지난 기록에 연결된 (삭제된) 부위명을 복원할 때 씀 */
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

/** 삭제되지 않은 기록 전체, 날짜 오름차순 */
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
    // 새 기록일 때만 싸이클을 다음 단계로 넘긴다 (기존 기록 수정 시에는 넘기지 않음)
    if (!existing) advanceCycleStep(db);
  });
}

/** 소프트 삭제 — 동기화 시 삭제도 전파 */
export function softDeleteLog(logDate: string) {
  const now = nowIso();
  getDb().runSync(
    'UPDATE workout_logs SET deleted_at = ?, updated_at = ?, synced = 0 WHERE log_date = ?',
    now, now, logDate,
  );
}

/** 추가 성공 시 부위 id 반환, 이미 있는(삭제되지 않은) 이름이면 null. 삭제됐던 동명 부위는 복구 */
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

/** 소프트 삭제 — 지난 기록과의 연결은 유지하고 목록에서만 제외. 동일 이름으로 재추가하면 복구됨 */
export function deleteBodyPart(id: string) {
  const now = nowIso();
  getDb().runSync(
    'UPDATE body_parts SET deleted_at = ?, is_active = 0, updated_at = ?, synced = 0 WHERE id = ?',
    now, now, id,
  );
}

/** 정렬 순서 한 칸 이동 (dir: -1 위 / +1 아래) */
export function moveBodyPart(id: string, dir: -1 | 1) {
  const parts = getBodyParts();
  const idx = parts.findIndex((p) => p.id === id);
  const other = parts[idx + dir];
  if (idx < 0 || !other) return;
  const reordered = [...parts];
  reordered[idx] = other;
  reordered[idx + dir] = parts[idx];
  const db = getDb();
  const now = nowIso();
  db.withTransactionSync(() => {
    // 현재 표시 순서 기준으로 전체 재번호
    reordered.forEach((p, i) => {
      db.runSync('UPDATE body_parts SET sort_order = ?, updated_at = ?, synced = 0 WHERE id = ?', i, now, p.id);
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

/** 목표 변경 이력, 오래된 주부터 — 지난 주를 그 주의 목표로 판정할 때 씀 */
export function getGoalHistory(): Goal[] {
  return getDb()
    .getAllSync<GoalRow>('SELECT target_count, recurring, week_start FROM goal_history ORDER BY week_start')
    .map((r) => ({ targetCount: r.target_count, recurring: r.recurring === 1, weekStart: r.week_start }));
}

/** 목표 설정/수정 — 매번 이번 주를 기준 주로 다시 잡고, 이력에도 남긴다 */
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

/** 싸이클 단계 등록/수정 */
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

/** 새 운동 기록이 저장될 때 싸이클을 다음 단계로  */
function advanceCycleStep(db: ReturnType<typeof getDb>) {
  const row = db.getFirstSync<CycleRow>('SELECT steps_json, current_index FROM workout_cycle WHERE id = 1');
  if (!row) return;
  const steps: WorkoutCycleStep[] = JSON.parse(row.steps_json);
  if (steps.length === 0) return;
  const nextIndex = (row.current_index + 1) % steps.length;
  db.runSync('UPDATE workout_cycle SET current_index = ?, updated_at = ? WHERE id = 1', nextIndex, nowIso());
}

/** 데이터 초기화 — 전부 지우고 기본 부위 재삽입 */
export function resetAllData() {
  const db = getDb();
  wipeLocalData(db);
  seedDefaultPartsIfEmpty(db);
}
