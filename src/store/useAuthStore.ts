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
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            clearUser: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // localStorage key
            storage: createJSONStorage(() => localStorage),
        }
    )
);
