import { DEFAULT_BODY_PARTS } from '@/constants/recovery';
import * as Crypto from 'expo-crypto';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

/**
 * 로컬 SQLite
 */

let db: SQLiteDatabase | null = null;

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

    -- 서버는 UNIQUE(user_id, log_date), 로컬은 단일 사용자라 log_date만 UNIQUE.
    -- 소프트 삭제(deleted_at) 행도 UNIQUE에 걸리므로 upsert 시 기존 행을 재사용한다.
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

    -- 이 로컬 캐시가 현재 어느 Supabase 계정 소유인지 기록한다.
    -- 계정이 바뀌면(다른 user_id) sync.ts가 이 표를 보고 로컬 데이터를 지운 뒤 다시 받는다.
    CREATE TABLE IF NOT EXISTS sync_owner (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id TEXT
    );

    -- 주간 운동 횟수 목표. 기기 로컬 전용(서버 동기화 안 함) — 로그아웃하면 사라지는 게 의도된 동작이다.
    -- 단일 사용자 설정이라 싱글턴(id=1) 행 하나만 둔다.
    -- recurring=0이면 week_start가 속한 주에만 유효 — 주가 지나면 목표 없음으로 취급한다.
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      target_count INTEGER NOT NULL,
      recurring INTEGER NOT NULL DEFAULT 0,
      week_start TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 주간 목표 변경 이력 (goals와 같이 기기 로컬 전용).
    -- 지난 주의 목표 달성 여부를 '그 주에 설정돼 있던 목표'로 판정하려고 남긴다.
    -- 설정한 주(월요일)당 한 행 — 같은 주에 여러 번 바꾸면 마지막 값만 남는다.
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

  // 이미 설치된 기기의 body_parts 테이블에는 deleted_at 컬럼이 없을 수 있어 있는지 확인 후 추가한다.
  ensureColumn(db, 'body_parts', 'deleted_at', 'TEXT');
  // 부위별 시간 기록 이전 버전 기기에는 duration_min 컬럼이 없을 수 있다.
  ensureColumn(db, 'workout_log_parts', 'duration_min', 'INTEGER NOT NULL DEFAULT 0');

  // 이력 테이블이 생기기 전에 설정해 둔 목표를 첫 이력으로 옮긴다 (이미 있으면 무시)
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

/** 계정 전환·로그아웃 시 이전 계정의 흔적을 지운다 (기본 부위 재시딩은 호출부 책임) */
export function wipeLocalData(db: SQLiteDatabase) {
  db.withTransactionSync(() => {
    db.execSync('DELETE FROM workout_log_parts; DELETE FROM workout_logs; DELETE FROM body_parts; DELETE FROM goals; DELETE FROM goal_history; DELETE FROM workout_cycle;');
  });
}

/** 최초 실행 시 기본 부위 7개 */
export function seedDefaultPartsIfEmpty(db: SQLiteDatabase) {
  const row = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM body_parts');
  if ((row?.n ?? 0) > 0) return;
  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    DEFAULT_BODY_PARTS.forEach((name, i) => {
      db.runSync(
        'INSERT INTO body_parts (id, name, sort_order, is_active, updated_at, synced) VALUES (?, ?, ?, 1, ?, 0)',
        Crypto.randomUUID(), name, i, now,
      );
    });
  });
}
