# Library Structure

이 프로젝트의 라이브러리는 **재사용성**과 **명확한 관심사 분리**를 위해 3개 폴더로 구성되어 있습니다.

## 📁 폴더 구조

```
src/lib/
├── server/          # 서버 전용 모듈
│   ├── auth.ts      # 인증 로직 (로그인, 토큰 갱신)
│   ├── db.ts        # 데이터베이스 연결 및 쿼리
│   ├── api-utils.ts # API 라우트 헬퍼 함수
│   └── index.ts     # 통합 export
│
├── shared/          # 서버/클라이언트 공통 모듈
│   ├── jwt.ts       # JWT 토큰 생성/검증
│   ├── types.ts     # 공통 타입 정의
│   ├── errors.ts    # 에러 클래스 및 핸들러
│   └── index.ts     # 통합 export
│
└── client/          # 클라이언트 전용 모듈
    └── index.ts     # (향후 확장 예정)
```

## 🎯 각 폴더의 목적

### 📂 server/
**서버에서만 실행되는 코드**
- 데이터베이스 접근
- 민감한 비즈니스 로직
- 서버 전용 라이브러리 (bcrypt, pg 등)
- **절대 클라이언트에서 import 금지**

**주요 모듈:**
- `auth.ts`: 사용자 인증, 토큰 갱신, 비밀번호 해싱
- `db.ts`: PostgreSQL 연결 풀, 쿼리 실행, 트랜잭션
- `api-utils.ts`: API 에러 핸들링, 쿠키 옵션 등

### 📂 shared/
**서버와 클라이언트 모두에서 사용 가능한 코드**
- 타입 정의
- JWT 검증 로직
- 공통 유틸리티 함수
- **환경에 무관한 순수 로직만 포함**

**주요 모듈:**
- `jwt.ts`: JWT 생성/검증/만료 체크
- `types.ts`: User, TokenPayload 등 공통 인터페이스
- `errors.ts`: 커스텀 에러 클래스

### 📂 client/
**클라이언트에서만 실행되는 코드** (향후 확장)
- 브라우저 전용 API
- 클라이언트 상태 관리
- UI 관련 유틸리티

## 💡 사용 예시

### API Route에서 사용 (server)
```typescript
import { authenticateUser, handleApiError } from '@/lib/server';
import { ValidationError } from '@/lib/shared';

export async function POST(request: NextRequest) {
  try {
    const result = await authenticateUser(userid, password);
    // ...
  } catch (error) {
    return handleApiError(error, 'Login');
  }
}
```

### 클라이언트 컴포넌트에서 사용 (shared만)
```typescript
import { TokenPayload } from '@/lib/shared';

// ❌ 금지: import { authenticateUser } from '@/lib/server'; 
// 서버 모듈은 클라이언트에서 사용 불가!
```

## 🔄 다른 프로젝트에서 재사용하기

### 1. lib 폴더 전체 복사
```bash
cp -r src/lib /path/to/new-project/src/
```

### 2. 환경 변수 설정
```env
# .env.local
DB_URL=postgresql://...
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### 3. 데이터베이스 테이블 생성
```sql
CREATE TABLE com_user (
  userid VARCHAR(50) PRIMARY KEY,
  usernm VARCHAR(100),
  pwd VARCHAR(255),
  email VARCHAR(255),
  refresh_token TEXT,
  refresh_token_expiry TIMESTAMP,
  userrole VARCHAR(50),
  lastlogin_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

### 4. 그대로 사용!
API route에서 바로 import하여 사용 가능:
```typescript
import { authenticateUser, refreshTokens } from '@/lib/server';
```

## 📝 설계 원칙

1. **관심사 분리**: 서버/클라이언트/공통 로직 명확히 구분
2. **재사용성**: 프로젝트 간 쉬운 이식
3. **타입 안전성**: TypeScript 인터페이스로 명확한 계약
4. **단일 책임**: 각 모듈은 하나의 명확한 목적만 수행
5. **의존성 최소화**: 외부 의존성을 최소화하여 이식성 향상

## 🔒 보안 고려사항

- 서버 모듈은 절대 클라이언트에 노출되지 않음
- JWT Secret은 환경 변수로 관리
- 비밀번호는 bcrypt로 해싱
- httpOnly 쿠키로 토큰 관리

## 🚀 향후 확장 계획

- `client/api-client.ts`: API 호출 래퍼
- `client/validators.ts`: 폼 검증 함수
- `shared/utils.ts`: 날짜, 문자열 포맷 등 유틸리티
- `server/email.ts`: 이메일 발송 로직
