/* 캘린더 월 보기 크기·동작 값 */

export const CALENDAR_H_PADDING = 16; // 격자 좌우 여백
export const MONTH_RANGE = 60; // 오늘 기준 앞뒤로 넘길 수 있는 개월 수
export const MAX_WEEK_ROWS = 6; // 한 달 최대 주 수

export const CELL_COLLAPSED = 46; // 접힘 칸 높이 (날짜 + 부위)
export const CELL_EXPANDED = 78; // 펼침 칸 높이 (+ 강도·컨디션)
export const CELL_V_PADDING = 6; // 칸 위아래 여백 합 (py-[3px])

export const ROW_HEIGHT = CELL_EXPANDED + CELL_V_PADDING; // 주 한 줄 높이 (펼침 기준 고정)
export const ROW_OVERLAP = CELL_EXPANDED - CELL_COLLAPSED; // 접힘 시 줄마다 위로 겹치는 높이
export const GRID_MAX_HEIGHT = MAX_WEEK_ROWS * ROW_HEIGHT; // 격자 최대 높이

export const GESTURE_SLOP = 10; // 제스처 방향 판단 거리
export const EXPAND_DRAG_DISTANCE = 70; // 끝까지 펼치는 드래그 거리
export const EXPAND_FLING_VELOCITY = 600; // 펼침으로 보는 아래 방향 속도
export const EXPAND_SETTLE_MS = 220; // 손 뗀 뒤 접힘·펼침 마무리 시간
