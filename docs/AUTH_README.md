# JWT 인증 구현 가이드

이 프로젝트는 Next.js 14+에서 JWT 기반 인증을 구현한 예제입니다.

## 🔐 주요 기능

- ✅ JWT Access Token / Refresh Token 기반 인증
- ✅ HttpOnly, Secure, SameSite 쿠키 설정 (XSS, CSRF 방어)
- ✅ PostgreSQL DB에 Refresh Token 저장
- ✅ Access Token, Refresh Toekn 자동 갱신
- ✅ 사용자 ID 저장 기능
- ✅ 로그인/로그아웃 기능

## 📦 설치된 패키지

```bash
npm install jsonwebtoken bcrypt pg js-cookie
npm install -D @types/jsonwebtoken @types/bcrypt @types/pg @types/js-cookie
```

## 🗄️ 데이터베이스 설정

### PostgreSQL 테이블 생성

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

### 테스트 사용자 추가 (비밀번호는 bcrypt로 해싱 필요)

```sql
-- 비밀번호 "test123" 해싱 예제
INSERT INTO com_user (userid, usernm, pwd, email)
VALUES ('testuser', '테스트사용자', '$2b$10$...해싱된비밀번호...', 'test@example.com');
```

Node.js에서 비밀번호 해싱:
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash('test123', 10);
console.log(hashedPassword);
```

## ⚙️ 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 설정하세요:

```env
# JWT Secrets (프로덕션에서는 반드시 변경)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# JWT Expiry
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Database
DB_URL=postgresql://username:password@localhost:5432/database_name

# Environment
NODE_ENV=development
```

⚠️ **보안 주의사항:**
- JWT Secret은 최소 32자 이상의 무작위 문자열을 사용하세요
- 프로덕션 환경에서는 환경변수를 서버 설정에서 관리하세요
- .env.local 파일은 절대 Git에 커밋하지 마세요

## 🚀 실행 방법

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts      # 로그인 API
│   │       ├── logout/route.ts     # 로그아웃 API
│   │       └── verify/route.ts     # 토큰 검증 API
│   ├── login/
│   │   └── page.tsx                # 로그인 페이지
│   ├── dashboard/
│   │   └── page.tsx                # 인증 성공 페이지 (테스트용)
│   └── page.tsx                    # 메인 페이지 (로그인으로 리다이렉트)
├── lib/
│   ├── db.ts                       # PostgreSQL 연결
│   ├── jwt.ts                      # JWT 유틸리티
│   └── auth.ts                     # 인증 로직
└── types/
    └── env.d.ts                    # 환경변수 타입 정의
```

## 🔒 보안 기능

### 1. JWT 토큰
- **Access Token**: 15분 유효, 짧은 만료 시간으로 보안 강화
- **Refresh Token**: 7일 유효, 장기 인증 유지

### 2. 쿠키 보안 설정
- **httpOnly**: JavaScript로 쿠키 접근 불가 (XSS 방어)
- **secure**: HTTPS 연결에서만 쿠키 전송
- **sameSite: 'strict'**: CSRF 공격 방어

### 3. 토큰 갱신 로직
- Access Token 만료 시 Refresh Token으로 자동 갱신
- Access Token 만료 전에는 갱신되는 것 없으나 만료 이후엔 2개 Token 모두 자동 갱신
- Refresh Token은 DB에 저장하여 무효화 가능
- 만료된 Refresh Token 감지 시 재로그인 요구

## 🧪 테스트 방법

1. **로그인 테스트**
   - http://localhost:3000/login 접속
   - DB에 등록된 사용자 정보로 로그인

2. **토큰 검증 테스트**
   - 로그인 후 대시보드 페이지 확인
   - 페이지 새로고침하여 토큰 검증 확인

3. **토큰 갱신 테스트**
   - 15분 대기 후 페이지 새로고침
   - Access Token 자동 갱신 확인 (콘솔 로그)
   - Refresh Token 자동 갱신 확인 (DB Table Field)

4. **만료 테스트**
   - 7일 후 Refresh Token 만료 시 로그인 페이지로 이동

## 📝 JWT Payload

JWT에는 다음 정보가 인코딩됩니다:

```typescript
{
  userid: string;   // 사용자 ID
  usernm: string;   // 사용자 이름
  email: string;    // 이메일
}
```

## 🛠️ API 엔드포인트

### POST /api/auth/login
로그인 요청

**Request:**
```json
{
  "userid": "testuser",
  "password": "test123"
}
```

**Response (성공):**
```json
{
  "success": true,
  "user": {
    "userid": "testuser",
    "usernm": "테스트사용자",
    "email": "test@example.com",
    "userrole": null => admin 등으로 표시 (프론트엔드에서 크리티컬하게 사용하면 보안 위험 발생)
  }
}
```

### GET /api/auth/verify
토큰 검증 및 갱신

**Response (성공):**
```json
{
  "success": true,
  "user": {
    "userid": "testuser",
    "usernm": "테스트사용자",
    "email": "test@example.com"
  },
  "refreshed": false  // 토큰이 갱신된 경우 true
}
```

### POST /api/auth/logout
로그아웃

**Response:**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

## 🔧 추가 개선 사항

프로덕션 배포 전 고려사항:

1. **Rate Limiting**: 로그인 API에 속도 제한 추가
2. **IP 기반 차단**: 무차별 대입 공격 방어
3. **로그인 시도 제한**: 계정별 로그인 실패 횟수 제한
4. **2FA 인증**: 2단계 인증 추가
5. **감사 로그**: 로그인 이력 추적
6. **JWT Blacklist**: 로그아웃 시 토큰 무효화
7. **CORS 설정**: API 접근 도메인 제한

## 📌 주의사항

- ⚠️ `.env.local` 파일의 DB 연결 정보를 실제 PostgreSQL 서버에 맞게 수정하세요
- ⚠️ JWT Secret은 절대 노출되지 않도록 주의하세요
- ⚠️ 프로덕션 환경에서는 HTTPS를 반드시 사용하세요
- ⚠️ 비밀번호는 반드시 bcrypt로 해싱하여 저장하세요

## 🐛 문제 해결

### DB 연결 오류
- PostgreSQL 서버가 실행 중인지 확인
- DB_URL 연결 문자열이 올바른지 확인
- 방화벽/보안 그룹 설정 확인

### JWT 검증 실패
- .env.local의 JWT Secret이 설정되었는지 확인
- 개발 서버 재시작

### 쿠키가 저장되지 않음
- localhost에서는 secure: false로 테스트
- 브라우저 개발자 도구에서 쿠키 확인

## 📚 참고 자료

- [Next.js Documentation](https://nextjs.org/docs)
- [JWT.io](https://jwt.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
