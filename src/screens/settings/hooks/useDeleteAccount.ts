import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useState } from 'react';
import { toast } from '@/lib/toast';

/** 회원 탈퇴 (확인 모달 → 서버·기기 데이터 삭제) */
export function useDeleteAccount() {
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const loadAll = useWorkoutStore((s) => s.loadAll);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = () => setConfirmVisible(true);
  const cancelDelete = () => setConfirmVisible(false);

  const confirmDelete = async () => {
    setConfirmVisible(false);
    setDeleting(true);
    try {
      await deleteAccount();
      loadAll(); // 비워진 로컬 DB로 화면 갱신
      toast.done('탈퇴했어요', '그동안 이용해 주셔서 감사해요');
    } catch (e) {
      console.warn('회원 탈퇴 실패', e);
      toast.error('탈퇴하지 못했어요', '인터넷 연결을 확인해 주세요');
    } finally {
      setDeleting(false);
    }
  };

  return { confirmVisible, deleting, requestDelete, cancelDelete, confirmDelete };
}
