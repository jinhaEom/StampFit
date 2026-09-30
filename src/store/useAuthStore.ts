import { getDb, seedDefaultPartsIfEmpty, setSyncOwner, wipeLocalData } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  hydrated: boolean;
  session: Session | null;
  user: User | null;
  isLoggedIn: boolean;
  initialize: () => void;
  logout: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  session: null,
  user: null,
  isLoggedIn: false,
  initialize: () => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isLoggedIn: !!session, hydrated: true });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isLoggedIn: !!session, hydrated: true });
    });
  },
  /** 로그아웃 후 이 기기 기록 삭제 (서버 동기화는 호출부에서 먼저) */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    /* 로그아웃 실패 시 로컬 기록 유지 */
    if (error) throw error;
    const db = getDb();
    wipeLocalData(db);
    seedDefaultPartsIfEmpty(db); // 로그아웃 뒤에도 기본 부위는 보이게
    setSyncOwner(null);
  },
}));
