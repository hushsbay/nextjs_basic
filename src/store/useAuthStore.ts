import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserInfo {
    userid: string;
    usernm: string;
    email: string;
}

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    setUser: (user: UserInfo | null) => void;
    clearUser: () => void;
}

// zustand store with localStorage persistence
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }), // !!는 null, undefined 뿐만 아니라 "", 0까지도 false로 인식함 (나머지는 true)
            clearUser: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // localStorage key
            storage: createJSONStorage(() => localStorage),
        }
    )
);
