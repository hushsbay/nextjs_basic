# Logger 사용 가이드

## 개요

Pino 기반의 로깅 시스템으로, 하루 단위로 로그 파일이 자동으로 생성됩니다.

## 로그 파일 위치

- `logs/app-YYYY-MM-DD.log` (예: `logs/app-2025-12-28.log`)
- 매일 새로운 파일이 생성됩니다
- `.gitignore`에 포함되어 Git에 추적되지 않습니다

## 로그 포맷

### 타임스탬프
- **형식**: `YYYY-MM-DD HH:mm:ss.microseconds`
- **예시**: `2025-12-28 14:35:42.123456`
- 24시간 형식 (오후 2시 = 14시)

### 자동 포함 정보
- **timestamp**: 로그 기록 시각
- **clientIP**: 클라이언트 실제 IP (프록시 헤더 고려)
- **function**: 함수명 (logError에서만, 자동 추출)
- **level**: 로그 레벨 (error, info)

## 사용 방법

### 1. catch 블록 에러 처리 (권장 - 한줄 처리)

```typescript
import { responseCatchedError } from '@/lib/server/error-response';

export async function POST(request: NextRequest) {
    try {
        // 비즈니스 로직
    } catch (error) {
        return responseCatchedError(
            error, 
            '기본 에러 메시지',
            request,  // IP 추출용 (선택)
            { additionalKey: 'value' }  // 추가 정보 (선택)
        );
    }
}
```

**responseCatchedError가 자동으로 처리:**
- ✅ 에러 로깅 (파일 + 터미널)
- ✅ 함수명 자동 추출
- ✅ 클라이언트 IP 자동 추출
- ✅ AuthenticationError → 401, 기타 → 500
- ✅ JSON 응답 반환

### 2. 수동 에러 로깅

```typescript
import { logError } from '@/lib/server/logger';

try {
    // 비즈니스 로직
} catch (error) {
    // 마지막 파라미터: 'F'(파일만), 'T'(터미널만), 'B'(둘다, 기본값)
    logError(
        error, 
        { userId: 'user123', action: 'login' },  // 추가 정보
        request,  // NextRequest (IP용, 선택)
        'B'  // 파일+터미널 (기본값)
    );
}
```

### 3. 비즈니스 이벤트 로깅

```typescript
import { logInfo } from '@/lib/server/logger';

// 로그인 성공
logInfo(
    '사용자 로그인 성공', 
    { userId: 'hushsbay', role: 'admin' },
    request,  // NextRequest (IP용, 선택)
    'B'  // 파일+터미널 (기본값)
);

// 결제 완료 (파일에만 기록)
logInfo(
    '결제 처리 완료', 
    { orderId: '12345', amount: 50000 },
    request,
    'F'  // 파일만
);

// 서버 시작 (터미널에만 표시)
logInfo(
    '서버 시작', 
    { port: 3000, env: process.env.NODE_ENV },
    undefined,  // request 없음
    'T'  // 터미널만
);
```

## 로그 타겟 옵션

마지막 파라미터로 로깅 대상 지정:

| 값 | 의미 | 사용 사례 |
|---|---|---|
| `'F'` | 파일만 | 프로덕션 비즈니스 로그 |
| `'T'` | 터미널만 | 개발/디버깅 정보 |
| `'B'` | 둘다 (기본값) | 중요 이벤트, 에러 |

**생략 시 기본값은 `'B'`입니다.**

## 실제 사용 예시

### 예시 1: API 라우트 (권장)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logInfo } from '@/lib/server/logger';
import { responseCatchedError } from '@/lib/server/error-response';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        
        // 비즈니스 로깅 (파일만)
        logInfo('작업 시작', { userId }, request, 'F');
        
        // 비즈니스 로직
        const result = await someOperation(userId);
        
        // 완료 로깅 (파일+터미널)
        logInfo('작업 완료', { userId, result }, request);
        
        return NextResponse.json({ success: true, result });
    } catch (error) {
        // 한줄로 에러 처리
        return responseCatchedError(error, '작업 실패', request);
    }
}
```

### 예시 2: 트랜잭션 처리

[token_test/invalidate/route.ts](../src/app/api/token_test/invalidate/route.ts) 참조

```typescript
export async function POST(request: NextRequest) {
    try {
        logInfo('토큰 무효화 시작', { userId }, request, 'F');
        
        await transaction(async (client) => {
            await client.query('UPDATE ...');
        });
        
        logInfo('토큰 무효화 완료', { userId }, request);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return responseCatchedError(
            error, 
            '토큰 무효화 중 오류',
            request,
            { hasToken: !!token }
        );
    }
}
```

## 로그 파일 예시

```json
{"timestamp":"2025-12-28 14:35:42.123456","level":"info","clientIP":"192.168.1.100","userId":"hushsbay","msg":"[INFO] 사용자 로그인 성공"}
{"timestamp":"2025-12-28 14:36:15.789012","level":"error","function":"POST","clientIP":"192.168.1.100","error":{"name":"AuthenticationError","message":"비밀번호 불일치","stack":"..."},"hasToken":true,"msg":"[ERROR] [POST] 비밀번호 불일치"}
```

## time vs timestamp 설명

- **기존**: pino가 자동으로 `time` 필드 생성 (Unix timestamp)
- **현재**: 커스텀 `timestamp` 필드 사용 (사람이 읽기 쉬운 형식)
- **변경 이유**: YYYY-MM-DD HH:mm:ss.microseconds 형식이 로그 분석에 더 유용

## 클라이언트 IP 추출

자동으로 다음 순서로 IP를 추출합니다:

1. `x-forwarded-for` 헤더 (프록시/로드밸런서)
2. `x-real-ip` 헤더 (Nginx 등)
3. `request.ip` (Next.js 기본)
4. 'unknown' (추출 실패시)

## 프로덕션 배포 시 주의사항

### 1. 로그 파일 정리

매일 새 파일이 생성되므로, 오래된 로그는 주기적으로 삭제:

```bash
# 30일 이상 된 로그 삭제
find logs/ -name "app-*.log" -mtime +30 -delete

# crontab 등록 (매일 새벽 3시)
0 3 * * * find /path/to/nextjs_basic/logs/ -name "app-*.log" -mtime +30 -delete
```

### 2. 디스크 공간 모니터링

```bash
# 로그 디렉토리 크기 확인
du -sh logs/

# 가장 큰 로그 파일 찾기
ls -lhS logs/
```

### 3. logrotate 사용 (Ubuntu - 선택사항)

`/etc/logrotate.d/nextjs-app`:

```bash
/path/to/nextjs_basic/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### 4. 환경 변수 설정

`.env.local`:

```bash
# 로그 레벨
LOG_LEVEL=info

# 프로덕션 모드
NODE_ENV=production
```

## API 참조

### logError()

```typescript
logError(
    error: unknown,                    // 에러 객체
    additionalInfo?: Record<string, any>,  // 추가 정보
    request?: NextRequest,             // IP 추출용
    target?: 'F' | 'T' | 'B'          // 기본값: 'B'
)
```

- 함수명 자동 추출
- AuthenticationError 구분

### logInfo()

```typescript
logInfo(
    message: string,                   // 로그 메시지
    data?: Record<string, any>,       // 추가 데이터
    request?: NextRequest,            // IP 추출용
    target?: 'F' | 'T' | 'B'         // 기본값: 'B'
)
```

### responseCatchedError()

```typescript
responseCatchedError(
    error: unknown,                    // 에러 객체
    defaultMessage: string,            // 기본 메시지
    request?: NextRequest,             // IP 추출용
    additionalInfo?: Record<string, any>,  // 추가 정보
    logTarget?: 'F' | 'T' | 'B'       // 기본값: 'B'
): NextResponse
```

- 에러 로깅 + 응답 생성 일체형
- AuthenticationError → 401
- 기타 에러 → 500

## 베스트 프랙티스

1. **catch 블록**: `responseCatchedError()` 사용 (권장)
2. **비즈니스 이벤트**: `logInfo()` 사용
3. **민감 정보**: 비밀번호, 토큰은 로그에 기록하지 않기
4. **프로덕션**: 파일 로깅 (`'F'`) 적극 활용
5. **개발**: 터미널 로깅 (`'T'`) 활용
6. **중요 이벤트**: 둘다 (`'B'`, 기본값) 사용
