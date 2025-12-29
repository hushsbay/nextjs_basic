# Next.js JWT Authentication Template

Next.js 15+ 기반의 완전한 JWT 인증 템플릿 프로젝트입니다. httpOnly 쿠키를 사용한 보안 강화, Zustand 상태 관리, 자동 토큰 갱신 등 프로덕션급 기능을 포함합니다.

## 🚀 주요 기능

### 인증 & 보안
- ✅ JWT AccessToken / RefreshToken 기반 인증
- ✅ httpOnly, secure, sameSite 쿠키 설정 (XSS, CSRF 방어)
- ✅ AccessToken 만료 시 RefreshToken으로 자동 갱신
- ✅ PostgreSQL에 RefreshToken 안전하게 저장
- ✅ bcrypt를 이용한 비밀번호 해싱 (saltRounds: 10)
- ✅ 로그인 성공 시 lastlogin_at 자동 업데이트

### 상태 관리
- ✅ Zustand를 이용한 전역 상태 관리
- ✅ localStorage 자동 동기화 (persist middleware)
- ✅ JWT decoded 정보 (userid, usernm, email) 관리
- ✅ 로그아웃 시 자동 상태 초기화

### UI/UX
- ✅ 자동 포커싱 (사용자 ID → 비밀번호)
- ✅ 사용자 ID 저장 기능
- ✅ 로딩 상태 및 에러 처리
- ✅ Tailwind CSS를 이용한 반응형 디자인

### 로깅
- ✅ 일별 로그 파일 자동 생성 (logs/app-YYYY-MM-DD.log)
- ✅ pino 기반 고성능 로깅
- ✅ 파일/터미널 출력 선택 가능
- ✅ 자동 호출자 함수명 추적
- ✅ 클라이언트 IP 자동 추출

### 에러 핸들링
- ✅ error.tsx: 일반 페이지 에러 처리
- ✅ global-error.tsx: 루트 레이아웃 에러 처리 (최후 방어선)
- ✅ 개발/프로덕션 환경별 에러 메시지 분기
- ✅ 에러 테스트 페이지 제공 (/error-test)

## 📦 기술 스택

- **프레임워크**: Next.js 16.1+ (App Router)
- **언어**: TypeScript 5+
- **스타일**: Tailwind CSS 4+
- **데이터베이스**: PostgreSQL
- **인증**: JWT (jsonwebtoken)
- **비밀번호**: bcrypt
- **상태관리**: Zustand
- **로깅**: pino, pino-roll
- **쿠키**: js-cookie

## 🗂️ 프로젝트 구조

```
nextjs_basic/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/                 # 인증 API
│   │   │   │   ├── login/route.ts    # 로그인
│   │   │   │   ├── logout/route.ts   # 로그아웃
│   │   │   │   └── verify/route.ts   # 토큰 검증
│   │   │   └── token_test/           # 토큰 테스트 API
│   │   │       ├── expiry/route.ts   # 토큰 만료 테스트
│   │   │       └── invalidate/route.ts # 토큰 무효화
│   │   ├── login/                    # 로그인 페이지
│   │   │   └── page.tsx
│   │   ├── dashboard/                # 대시보드 (인증 필요)
│   │   │   └── page.tsx
│   │   ├── error-test/               # 에러 핸들링 테스트
│   │   │   ├── page.tsx              # 테스트 메인
│   │   │   └── global/page.tsx       # 글로벌 에러 발생
│   │   ├── layout.tsx                # 루트 레이아웃
│   │   ├── page.tsx                  # 홈 (로그인으로 리다이렉트)
│   │   ├── error.tsx                 # 일반 에러 핸들러
│   │   └── global-error.tsx          # 글로벌 에러 핸들러
│   │
│   ├── lib/                          # 유틸리티 라이브러리
│   │   ├── server/                   # 서버 전용 모듈
│   │   │   ├── auth.ts               # 인증 로직 (로그인, 토큰 갱신, 로그아웃)
│   │   │   ├── db.ts                 # PostgreSQL 연결 및 쿼리
│   │   │   ├── api-utils.ts          # API 헬퍼 (에러 처리, 쿠키 등)
│   │   │   ├── logger.ts             # 로깅 유틸리티
│   │   │   └── index.ts              # 통합 export
│   │   │
│   │   ├── client/                   # 클라이언트 전용 모듈
│   │   │   ├── api-client.ts         # API 호출 래퍼
│   │   │   └── index.ts              # 통합 export
│   │   │
│   │   └── shared/                   # 서버/클라이언트 공통 모듈
│   │       ├── jwt.ts                # JWT 생성/검증
│   │       ├── types.ts              # 공통 타입 정의
│   │       ├── errors.ts             # 에러 클래스
│   │       ├── utils.ts              # 공통 유틸리티
│   │       └── index.ts              # 통합 export
│   │
│   ├── store/                        # Zustand 상태 관리
│   │   └── useAuthStore.ts           # 인증 상태 스토어
│   │
│   └── types/                        # 추가 타입 정의
│
├── logs/                             # 로그 파일 (자동 생성)
│   └── app-YYYY-MM-DD.log            # 일별 로그
│
├── .env.local                        # 환경 변수 (gitignore)
├── package.json                      # 의존성 관리
├── tsconfig.json                     # TypeScript 설정
├── tailwind.config.js                # Tailwind CSS 설정
└── next.config.ts                    # Next.js 설정
```

## 🔧 설치 및 실행

### 1. 저장소 클론 및 의존성 설치

```bash
cd c:\Src\Git\basic\project_template\nextjs_basic
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성:

```env
# JWT Secrets (프로덕션에서는 반드시 변경, 최소 32자)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# JWT Expiry
JWT_ACCESS_EXPIRY=1m    # 1분 (테스트용, 프로덕션: 15m)
JWT_REFRESH_EXPIRY=3m   # 3분 (테스트용, 프로덕션: 7d)

# Database (PostgreSQL)
DB_URL=postgresql://username:password@localhost:5432/database_name

# Environment
NODE_ENV=development

# Logging (선택 사항)
LOG_LEVEL=info
```

### 3. 데이터베이스 설정

PostgreSQL에서 테이블 생성:

```sql
CREATE TABLE com_user (
    userid         VARCHAR(20) PRIMARY KEY,
    usernm         VARCHAR(100) NOT NULL,
    pwd            VARCHAR(300) NOT NULL,
    email          VARCHAR(100) NOT NULL,
    refresh_token  VARCHAR(600) NULL,
    refresh_token_expiry TIMESTAMP NULL,
    userrole       VARCHAR(20) NULL,
    lastlogin_at   TIMESTAMPTZ NULL,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ NULL
);
```

테스트 사용자 추가:

```sql
-- 비밀번호: test123
INSERT INTO com_user (userid, usernm, pwd, email)
VALUES ('testuser', '테스트사용자', '$2b$10$YourHashedPasswordHere', 'test@example.com');
```

비밀번호 해싱 (Node.js):

```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash('test123', 10);
console.log(hashedPassword); // 이 값을 SQL의 pwd 필드에 입력
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📚 주요 구현 설명

### 1. JWT 인증 플로우

```
로그인 요청 → 사용자 확인 → bcrypt 비밀번호 검증
    → AccessToken (1분) + RefreshToken (3분) 생성
    → httpOnly 쿠키로 전송
    → RefreshToken은 DB에 저장 (com_user.refresh_token)

API 요청 → AccessToken 검증
    → 유효하면 요청 처리
    → 만료되었으면 RefreshToken으로 갱신
        → 새 AccessToken + RefreshToken 발급
        → 새 RefreshToken DB 업데이트
        → 자동으로 쿠키 갱신

로그아웃 → DB에서 RefreshToken 제거 → 쿠키 삭제
```

### 2. 보안 구현

**쿠키 설정** (`src/lib/server/api-utils.ts`):
```typescript
{
    httpOnly: true,      // JavaScript로 접근 불가 (XSS 방어)
    secure: true,        // HTTPS만 전송 (프로덕션)
    sameSite: 'lax',     // CSRF 방어
    path: '/',
    maxAge: undefined    // 세션 쿠키 (브라우저 종료 시 삭제)
}
```

**비밀번호 해싱** (`src/lib/server/auth.ts`):
```typescript
// bcrypt.hash()는 자체적으로 Promise 반환 (async 불필요)
export function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}
```

### 3. Zustand 상태 관리

**Store 정의** (`src/store/useAuthStore.ts`):
```typescript
interface UserInfo {
    userid: string;
    usernm: string;
    email: string;
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

**사용 예시**:
```typescript
// 로그인 시
const setUser = useAuthStore((state) => state.setUser);
setUser({ userid: 'test', usernm: '테스트', email: 'test@example.com' });

// 정보 읽기
const user = useAuthStore((state) => state.user);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// 로그아웃 시
const clearUser = useAuthStore((state) => state.clearUser);
clearUser();
```

### 4. 로깅 시스템

**일별 로그 파일** (`logs/app-YYYY-MM-DD.log`):
```typescript
// 에러 로깅
logError(error, { userid: 'test' }, request);

// 정보 로깅
logInfo('로그인 성공', { userid: 'test' }, request);
```

**로그 형식**:
```
[2025-12-29 14:30:45] [ERROR] app>api>auth>login>route.ts>POST | IP:127.0.0.1 | 사용자를 찾을 수 없습니다. | {"userid":"test"}
```

**출력 대상 선택**:
- `'F'`: 파일만
- `'T'`: 터미널만
- `'B'`: 파일 + 터미널 (기본값)

### 5. 에러 핸들링

**error.tsx** (일반 에러):
- 해당 라우트 및 하위 세그먼트 에러 캐치
- 레이아웃은 유지됨
- 컴포넌트 렌더링 에러, API 호출 에러 등

**global-error.tsx** (글로벌 에러):
- 루트 레이아웃 에러 캐치 (최후 방어선)
- `<html>`, `<body>` 태그 필수
- 매우 드물게 발생하는 심각한 에러

**테스트**: `/error-test` 페이지에서 두 가지 에러 테스트 가능

### 6. 자동 포커싱

**로그인 페이지** (`src/app/login/page.tsx`):
```typescript
const useridInputRef = useRef<HTMLInputElement>(null);
const passwordInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
    if (userid.trim() === '') {
        useridInputRef.current?.focus();  // 사용자 ID 비어있으면
    } else {
        passwordInputRef.current?.focus(); // 아니면 비밀번호로
    }
}, [userid]);
```

## 🧪 테스트 방법

### 1. 기본 인증 테스트

1. http://localhost:3000 접속 → 자동으로 `/login`으로 리다이렉트
2. 테스트 계정으로 로그인
3. 대시보드에서 사용자 정보 확인
4. 브라우저 개발자 도구 → Application → Local Storage → `auth-storage` 확인
5. 로그아웃 → localStorage 초기화 확인

### 2. 토큰 갱신 테스트

1. 로그인 후 대시보드 대기 (1분)
2. "토큰 만료 테스트" 버튼 클릭
3. AccessToken 만료 → RefreshToken으로 자동 갱신 확인
4. 새 토큰 만료 시간 확인

### 3. 에러 핸들링 테스트

1. 대시보드 → "error.tsx vs global-error.tsx 테스트 페이지" 클릭
2. "일반 에러 발생시키기" 버튼 → error.tsx 동작 확인
3. "글로벌 에러 페이지로 이동" 링크 → error.tsx 동작 확인 (일반 페이지 에러)

### 4. 로그 확인

```bash
# 로그 파일 확인
cat logs/app-2025-12-29.log

# 실시간 로그 모니터링 (Windows PowerShell)
Get-Content logs/app-2025-12-29.log -Wait -Tail 50
```

## 🔒 보안 주의사항

### ✅ 안전한 것
- JWT Secret은 환경 변수로 관리
- 비밀번호는 bcrypt로 해싱 (saltRounds: 10)
- RefreshToken은 DB에 저장
- AccessToken/RefreshToken은 httpOnly 쿠키
- XSS 방어: JavaScript로 토큰 접근 불가
- CSRF 방어: sameSite 설정

### ⚠️ 주의할 것
- `.env.local` 파일은 절대 Git에 커밋하지 않기
- 프로덕션 환경에서는 JWT Secret 변경 필수 (최소 32자)
- 프로덕션 환경에서는 토큰 만료 시간 조정 필요
  - AccessToken: 15분~1시간
  - RefreshToken: 7일~30일
- Zustand에는 민감하지 않은 정보만 저장 (비밀번호, 토큰 저장 금지)

### ❌ 하지 말아야 할 것
- localStorage에 JWT 토큰 저장
- 비밀번호 평문 저장
- 클라이언트에서 JWT Secret 노출
- console.log()로 민감 정보 출력 (프로덕션)

## 📖 추가 학습 자료

### 공식 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [JWT.io](https://jwt.io/)
- [Zustand](https://github.com/pmndrs/zustand)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [Tailwind CSS](https://tailwindcss.com/)

### 관련 개념
- **JWT**: JSON Web Token, 상태를 유지하지 않는 인증 방식
- **bcrypt**: 비밀번호 해싱 알고리즘 (salt + hash)
- **httpOnly Cookie**: JavaScript로 접근 불가한 쿠키
- **SameSite**: CSRF 공격 방어를 위한 쿠키 속성
- **Zustand**: React 상태 관리 라이브러리 (Redux 대안)

## 📝 라이센스

MIT License

---

**개발 환경**: Windows 11, Node.js 20+, PostgreSQL 14+  
**최종 수정**: 2025-12-29
