

export const HEATMAP_MAX_SCORE = 5 * 120; // 최대 점수 (강도 5 × 120분)
export const HEATMAP_LEVELS = 4; // 히트맵 단계 수

// 기본 부위 7개 (최초 실행·가입 시)
export const DEFAULT_BODY_PARTS = ['하체', '가슴', '등', '어깨', '팔', '코어', '유산소'];

export const INTENSITY_LABELS = ['아주 약하게', '약하게', '적당히', '세게', '아주 세게'];
export const CONDITION_LABELS = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'];
export const CONDITION_EMOJI = ['😫', '😕', '😐', '🙂', '😄'];

// 부위 선택 시 기본 시간 (분)
export const DURATION_DEFAULT = 30;
export const DURATION_STEP = 5;
export const DURATION_MAX = 600;
// 부위별 시간 빠른 선택 칩 (분)
export const DURATION_QUICK_PICKS = [10, 20, 30, 45, 60, 90];