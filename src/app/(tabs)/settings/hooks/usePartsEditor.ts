import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useState } from 'react';

/** 부위 관리 (추가·켜고 끄기·순서·삭제 확인) */
export function usePartsEditor() {
  const parts = useWorkoutStore((s) => s.parts);
  const addPart = useWorkoutStore((s) => s.addPart);
  const setPartActive = useWorkoutStore((s) => s.setPartActive);
  const reorderParts = useWorkoutStore((s) => s.reorderParts);
  const removePart = useWorkoutStore((s) => s.removePart);

  const [newName, setNewName] = useState(''); // 새 부위 이름 입력값
  const [duplicateAlertVisible, setDuplicateAlertVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null); // 삭제 확인 중인 부위

  const requestDeletePart = (id: string) => setDeleteTargetId(id);
  const cancelDeletePart = () => setDeleteTargetId(null);
  const confirmDeletePart = () => {
    if (deleteTargetId) removePart(deleteTargetId);
    setDeleteTargetId(null);
  };

  return {
    parts,
    addPart,
    setPartActive,
    reorderParts,
    newName,
    setNewName,
    duplicateAlertVisible,
    setDuplicateAlertVisible,
    deleteTargetId,
    requestDeletePart,
    cancelDeletePart,
    confirmDeletePart,
  };
}
