# Zustand 상태 관리 가이드

이 프로젝트에서는 JWT 인증 정보를 관리하기 위해 Zustand를 사용합니다.

## 🎯 왜 Zustand를 사용하나?

### 기존 방식의 문제점
- 각 컴포넌트에서 `useState`로 사용자 정보 관리
- 페이지 이동 시 상태가 초기화됨
- 여러 컴포넌트에서 같은 정보를 중복 관리

### Zustand의 장점
- ✅ **간단한 API**: Redux보다 훨씬 간단
- ✅ **TypeScript 친화적**: 타입 안정성 보장
- ✅ **보일러플레이트 없음**: 최소한의 코드
- ✅ **React 외부에서도 사용 가능**: 어디서든 접근 가능
- ✅ **자동 리렌더링**: 상태 변경 시 자동으로 컴포넌트 업데이트
- ✅ **Persist 지원**: localStorage 연동 가능

## 📦 설치

```bash
npm install zustand
```

## 🏗️ Store 구조

### useAuthStore.ts
```typescript
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

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            clearUser: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
```

## 📝 사용 방법

### 1. 로그인 시 사용자 정보 저장

```typescript
'use client';

import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
    const setUser = useAuthStore((state) => state.setUser);
    
    const handleLogin = async (userid: string, password: string) => {
        const response = await api.post('/api/auth/login', { userid, password });
        
        if (response.success) {
            // Zustand store에 사용자 정보 저장
            setUser({
                userid: response.user.userid,
                usernm: response.user.usernm,
                email: response.user.email,
            });
            
            router.push('/dashboard');
        }
    };
}
```

### 2. 다른 컴포넌트에서 사용자 정보 읽기

```typescript
'use client';

import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardPage() {
    // 필요한 부분만 선택적으로 가져오기
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    
    if (!isAuthenticated) {
        return <div>로그인이 필요합니다.</div>;
    }
    
    return (
        <div>
            <h1>환영합니다, {user?.usernm}님!</h1>
            <p>이메일: {user?.email}</p>
        </div>
    );
}
```

### 3. 로그아웃 시 사용자 정보 삭제

```typescript
'use client';

import { useAuthStore } from '@/store/useAuthStore';

export default function Header() {
    const clearUser = useAuthStore((state) => state.clearUser);
    
    const handleLogout = async () => {
        await api.post('/api/auth/logout');
        clearUser(); // Zustand store 초기화
        router.push('/login');
    };
    
    return (
        <button onClick={handleLogout}>로그아웃</button>
    );
}
```

### 4. 여러 값 한번에 사용하기

```typescript
// ❌ 비효율적 - 각각 구독하면 리렌더링 3번 발생
const user = useAuthStore((state) => state.user);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
const setUser = useAuthStore((state) => state.setUser);

// ✅ 효율적 - 한번에 가져오기
const { user, isAuthenticated, setUser } = useAuthStore();
```

## 🔄 상태 흐름

```
사용자 로그인
    ↓
JWT 토큰 생성 (서버)
    ↓
사용자 정보를 Zustand store에 저장
    ↓
localStorage에 자동 저장 (persist middleware)
    ↓
모든 컴포넌트에서 접근 가능
    ↓
로그아웃 시 store 초기화
    ↓
localStorage에서도 제거
```

## 🔐 보안 고려사항

### ✅ 안전한 정보만 저장
```typescript
// ✅ 좋은 예: 민감하지 않은 정보
interface UserInfo {
    userid: string;
    usernm: string;
    email: string;
}

// ❌ 나쁜 예: 민감한 정보는 절대 저장 금지
interface BadUserInfo {
    userid: string;
    password: string;  // ❌ 비밀번호 저장 금지
    accessToken: string;  // ❌ JWT 토큰은 httpOnly 쿠키에만
}
```

### 🔒 JWT 토큰은 쿠키에만
- **AccessToken/RefreshToken**: httpOnly, secure, sameSite 쿠키
- **사용자 정보**: Zustand store (localStorage)
- **중요**: 토큰 자체는 절대 localStorage에 저장하지 않음

## 📊 Redux vs Zustand 비교

| 항목 | Redux | Zustand |
|------|-------|---------|
| **보일러플레이트** | 많음 (actions, reducers, store) | 최소 |
| **번들 크기** | ~3.7KB | ~1.2KB |
| **학습 곡선** | 가파름 | 완만함 |
| **TypeScript** | 설정 필요 | 기본 지원 |
| **DevTools** | Redux DevTools | Zustand DevTools |
| **미들웨어** | 다양함 | Persist 등 제공 |

## 🚀 향후 확장 가능성

### 1. 추가 사용자 정보
```typescript
interface UserInfo {
    userid: string;
    usernm: string;
    email: string;
    avatar?: string;  // 프로필 사진
    role?: string;     // 사용자 권한
    preferences?: {    // 사용자 설정
        theme: 'light' | 'dark';
        language: 'ko' | 'en';
    };
}
```

### 2. 여러 Store 분리
```typescript
// authStore.ts - 인증 관련
export const useAuthStore = create<AuthState>(...);

// settingsStore.ts - 설정 관련
export const useSettingsStore = create<SettingsState>(...);

// notificationStore.ts - 알림 관련
export const useNotificationStore = create<NotificationState>(...);
```

### 3. 미들웨어 추가
```typescript
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                // ... state
            }),
            { name: 'auth-storage' }
        ),
        { name: 'AuthStore' }
    )
);
```

## 🧪 테스트

### Store 테스트
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/useAuthStore';

test('사용자 정보 설정', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
        result.current.setUser({
            userid: 'test',
            usernm: 'Test User',
            email: 'test@example.com',
        });
    });
    
    expect(result.current.user?.userid).toBe('test');
    expect(result.current.isAuthenticated).toBe(true);
});
```

## 📚 참고 자료

- [Zustand 공식 문서](https://github.com/pmndrs/zustand)
- [Zustand TypeScript 가이드](https://docs.pmnd.rs/zustand/guides/typescript)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

---

**현재 적용 상태**:
- ✅ 로그인 페이지: 로그인 성공 시 사용자 정보 저장
- ✅ 대시보드 페이지: 저장된 사용자 정보 표시
- ✅ 로그아웃: 사용자 정보 초기화
- ✅ localStorage 자동 동기화
