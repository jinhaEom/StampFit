import * as Burnt from 'burnt';

/* 알림 토스트 (iOS: 위에서 내려오는 알약 + 햅틱, Android: 시스템 토스트) */
// duration은 초 단위 (Burnt 기본값 5초는 너무 김)
export const toast = {
  done: (title: string, message?: string) =>
    Burnt.toast({ title, message, preset: 'done', haptic: 'success', duration: 1.5 }),
  error: (title: string, message?: string) =>
    Burnt.toast({ title, message, preset: 'error', haptic: 'error', duration: 2.5 }), // 오류는 읽을 시간 조금 더
  info: (title: string, message?: string) => Burnt.toast({ title, message, preset: 'none', duration: 1.5 }),
};
