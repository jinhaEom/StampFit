import { DEFAULT_BODY_PARTS } from '@/constants/recovery';
import * as Crypto from 'expo-crypto';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { todayStr } from './date';

let db: SQLiteDatabase | null = null; // 로컬 SQLite

export function getDb(): SQLiteDatabase {
  if (db) return db;
  db = openDatabaseSync('myhealth.db');
  migrate(db);
  seedDefaultPartsIfEmpty(db);
  return db;
}

function migrate(db: SQLiteDatabase) {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS body_parts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced INTEGER NOT NULL DEFAULT 0
    );

    -- 날짜당 1건 (log_date UNIQUE)
    -- 소프트 삭제 행도 UNIQUE라 upsert 시 기존 행 재사용
    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY NOT NULL,
      log_date TEXT NOT NULL UNIQUE,
      duration_min INTEGER NOT NULL,
      intensity INTEGER NOT NULL,
      condition INTEGER NOT NULL,
      memo TEXT,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workout_log_parts (
      log_id TEXT NOT NULL,
      body_part_id TEXT NOT NULL,
      duration_min INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (log_id, body_part_id)
    );

    -- 로컬 캐시 소유 계정 (바뀌면 sync.ts가 비우고 다시 받음)
    CREATE TABLE IF NOT EXISTS sync_owner (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id TEXT
    );

    -- 주간 운동 횟수 목표 (서버 동기화)
    -- 싱글턴 행 (id=1)
    -- recurring=0이면 week_start 주에만 유효
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      target_count INTEGER NOT NULL,
      recurring INTEGER NOT NULL DEFAULT 0,
      week_start TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 주간 목표 변경 이력 (서버 동기화)
    -- 지난주 달성 여부를 그 주 목표로 판정하는 데 사용
    -- 주(월요일)당 한 행, 같은 주 재설정 시 마지막 값만
    CREATE TABLE IF NOT EXISTS goal_history (
      week_start TEXT PRIMARY KEY NOT NULL,
      target_count INTEGER NOT NULL,
      recurring INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- 운동 싸이클 (서버 동기화)
    CREATE TABLE IF NOT EXISTS workout_cycle (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      steps_json TEXT NOT NULL,
      current_index INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  /* 예전 버전 기기에 없을 수 있는 컬럼 추가 */
  ensureColumn(db, 'body_parts', 'deleted_at', 'TEXT');
  ensureColumn(db, 'workout_log_parts', 'duration_min', 'INTEGER NOT NULL DEFAULT 0');
  /* 목표·싸이클 서버 동기화용 (기존 값은 0이라 다음 동기화 때 올라감) */
  ensureColumn(db, 'goals', 'synced', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'goal_history', 'synced', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'workout_cycle', 'synced', 'INTEGER NOT NULL DEFAULT 0');
  /* 싸이클 기준점 (current_index는 기준 날짜를 시작할 때의 차례) */
  ensureColumn(db, 'workout_cycle', 'anchor_date', 'TEXT');
  ensureColumn(db, 'workout_cycle', 'anchor_part_ids', "TEXT NOT NULL DEFAULT '[]'");

  /* 이력 테이블 이전 목표를 첫 이력으로 옮김 (있으면 무시) */
  db.execSync(`
    INSERT OR IGNORE INTO goal_history (week_start, target_count, recurring, updated_at)
    SELECT week_start, target_count, recurring, updated_at FROM goals WHERE id = 1;
  `);

  /* 예전 싸이클은 지금 차례를 오늘 기준점으로 */
  const today = todayStr();
  db.runSync(
    'UPDATE workout_cycle SET anchor_date = ?, anchor_part_ids = ?, synced = 0 WHERE id = 1 AND anchor_date IS NULL',
    today, JSON.stringify(getLogPartIds(db, today)),
  );
}

/** 그날 기록된 부위 id (싸이클 기준점용) */
export function getLogPartIds(db: SQLiteDatabase, logDate: string): string[] {
  return db
    .getAllSync<{ body_part_id: string }>(
      `SELECT p.body_part_id FROM workout_log_parts p
         JOIN workout_logs l ON l.id = p.log_id
       WHERE l.log_date = ? AND l.deleted_at IS NULL`,
      logDate,
    )
    .map((r) => r.body_part_id);
}

function ensureColumn(db: SQLiteDatabase, table: string, column: string, ddl: string) {
  const cols = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

export function getSyncOwner(): string | null {
  const row = getDb().getFirstSync<{ user_id: string | null }>('SELECT user_id FROM sync_owner WHERE id = 1');
  return row?.user_id ?? null;
}

export function setSyncOwner(userId: string | null) {
  getDb().runSync(
    'INSERT INTO sync_owner (id, user_id) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET user_id = excluded.user_id',
    userId,
  );
}

/** 로컬 데이터 전체 삭제 (기본 부위 재삽입은 호출부 몫) */
export function wipeLocalData(db: SQLiteDatabase) {
  db.withTransactionSync(() => {
    db.execSync('DELETE FROM workout_log_parts; DELETE FROM workout_logs; DELETE FROM body_parts; DELETE FROM goals; DELETE FROM goal_history; DELETE FROM workout_cycle;');
  });
}

/** 부위가 없으면 기본 부위 7개 삽입 */
export function seedDefaultPartsIfEmpty(db: SQLiteDatabase) {
  const row = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM body_parts');
  if ((row?.n ?? 0) > 0) return;
  const seededAt = new Date(0).toISOString(); // 가장 옛날 시각 (동기화 시 서버 값이 이기도록)
  db.withTransactionSync(() => {
    DEFAULT_BODY_PARTS.forEach((name, i) => {
      db.runSync(
        'INSERT INTO body_parts (id, name, sort_order, is_active, updated_at, synced) VALUES (?, ?, ?, 1, ?, 0)',
        Crypto.randomUUID(), name, i, seededAt,
      );
    });
  });
}
