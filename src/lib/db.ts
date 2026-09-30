import { DEFAULT_BODY_PARTS } from '@/constants/recovery';
import * as Crypto from 'expo-crypto';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

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

    -- 주간 운동 횟수 목표 (기기 전용, 로그아웃 시 삭제)
    -- 싱글턴 행 (id=1)
    -- recurring=0이면 week_start 주에만 유효
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      target_count INTEGER NOT NULL,
      recurring INTEGER NOT NULL DEFAULT 0,
      week_start TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 주간 목표 변경 이력 (기기 전용)
    -- 지난주 달성 여부를 그 주 목표로 판정하는 데 사용
    -- 주(월요일)당 한 행, 같은 주 재설정 시 마지막 값만
    CREATE TABLE IF NOT EXISTS goal_history (
      week_start TEXT PRIMARY KEY NOT NULL,
      target_count INTEGER NOT NULL,
      recurring INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- 운동 싸이클
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

  /* 이력 테이블 이전 목표를 첫 이력으로 옮김 (있으면 무시) */
  db.execSync(`
    INSERT OR IGNORE INTO goal_history (week_start, target_count, recurring, updated_at)
    SELECT week_start, target_count, recurring, updated_at FROM goals WHERE id = 1;
  `);
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
