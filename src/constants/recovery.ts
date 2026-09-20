

export const HEATMAP_MAX_SCORE = 5 * 120; // 강도5 × 120분
export const HEATMAP_LEVELS = 4; //히트맵 레벨

/** 가입/최초 실행 시 제공하는 기본 부위 7개 */
export const DEFAULT_BODY_PARTS = ['하체', '가슴', '등', '어깨', '팔', '코어', '유산소'];

export const INTENSITY_LABELS = ['아주 약하게', '약하게', '적당히', '세게', '아주 세게'];
export const CONDITION_LABELS = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'];
export const CONDITION_EMOJI = ['😫', '😕', '😐', '🙂', '😄'];

/** 부위를 새로 선택했을 때 기본으로 채워지는 시간 */
export const DURATION_DEFAULT = 30;
export const DURATION_STEP = 5;
export const DURATION_MAX = 600;
/** 부위별 시간 카드의 빠른 선택 칩 */
export const DURATION_QUICK_PICKS = [10, 20, 30, 45, 60, 90];