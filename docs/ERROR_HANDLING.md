# Error Handling in Next.js: error.tsx vs global-error.tsx

Next.js는 두 가지 유형의 에러 경계(Error Boundary)를 제공합니다.

## 📘 error.tsx

### 역할
- 특정 라우트 세그먼트와 그 하위 세그먼트에서 발생하는 에러를 캐치
- 일반적인 컴포넌트 렌더링 에러 처리
- 가장 일반적으로 사용되는 에러 핸들러

### 특징
- ✅ 레이아웃(layout.tsx)은 유지되고 에러 UI만 표시됨
- ✅ 페이지별로 다른 에러 UI를 제공할 수 있음
- ✅ `reset()` 함수로 에러 복구 시도 가능
- ✅ 반드시 'use client' 지시어 필요 (클라이언트 컴포넌트)

### 언제 호출되나?
1. 페이지 컴포넌트에서 에러 발생
2. 하위 컴포넌트에서 에러 발생
3. API 호출 중 예외 발생
4. useEffect 등에서 에러 발생

### 사용 예시
```tsx
'use client';

export default function Error({ 
    error, 
    reset 
}: { 
    error: Error & { digest?: string }; 
    reset: () => void 
}) {
    return (
        <div>
            <h2>오류가 발생했습니다</h2>
            <p>{error.message}</p>
            <button onClick={reset}>다시 시도</button>
        </div>
    );
}
```

## 📕 global-error.tsx

### 역할
- **루트 레이아웃(app/layout.tsx)**에서 발생하는 에러를 캐치
- 전체 애플리케이션의 최상위 에러 경계
- error.tsx가 캐치하지 못한 에러의 최후 방어선

### 특징
- ⚠️ `<html>`과 `<body>` 태그를 반드시 포함해야 함
- ⚠️ 루트 레이아웃도 에러가 발생했으므로 레이아웃을 대체해야 함
- ⚠️ 프로덕션 환경에서는 매우 드물게 발생
- ✅ 반드시 'use client' 지시어 필요

### 언제 호출되나?
1. 루트 레이아웃(app/layout.tsx)에서 에러 발생
2. 루트 레이아웃의 서버 컴포넌트에서 에러 발생
3. 애플리케이션 전체에 영향을 미치는 심각한 에러

### 사용 예시
```tsx
'use client';

export default function GlobalError({ 
    error, 
    reset 
}: { 
    error: Error & { digest?: string }; 
    reset: () => void 
}) {
    return (
        <html>
            <body>
                <h2>심각한 오류가 발생했습니다</h2>
                <p>{error.message}</p>
                <button onClick={reset}>다시 시도</button>
            </body>
        </html>
    );
}
```

## 🔄 에러 캐치 순서

```
컴포넌트에서 에러 발생
        ↓
    error.tsx 체크
        ↓
    있으면 error.tsx 렌더링
        ↓
    없으면 상위 error.tsx 찾기
        ↓
    최상위까지 없으면 global-error.tsx
        ↓
    global-error.tsx도 없으면 Next.js 기본 에러 페이지
```

## 📊 비교표

| 항목 | error.tsx | global-error.tsx |
|------|-----------|------------------|
| **위치** | 각 라우트 폴더 | 루트 app 폴더 |
| **캐치 범위** | 해당 라우트 세그먼트 | 루트 레이아웃 에러 |
| **레이아웃 유지** | ✅ 유지됨 | ❌ 레이아웃도 교체 |
| **html/body 필요** | ❌ 불필요 | ✅ 필수 |
| **발생 빈도** | 자주 | 매우 드물게 |
| **우선순위** | 높음 | 최후 |

## 🧪 테스트 방법

### 1. error.tsx 테스트
```tsx
'use client';

export default function TestPage() {
    throw new Error('일반 에러 테스트');
    return <div>Test</div>;
}
```
→ error.tsx가 에러를 캐치하고 표시

### 2. global-error.tsx 테스트
루트 레이아웃에서 에러를 발생시키거나, 전체 앱에 영향을 주는 에러 발생
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
    throw new Error('루트 레이아웃 에러');
    return <html><body>{children}</body></html>;
}
```
→ global-error.tsx가 에러를 캐치하고 표시

## ✅ 권장사항

1. **error.tsx는 필수**
   - 모든 주요 라우트에 error.tsx 구현
   - 사용자 친화적인 에러 메시지 제공
   - 에러 로깅 구현

2. **global-error.tsx는 선택적**
   - 하지만 프로덕션 앱에서는 구현 권장
   - 최악의 상황에 대비한 안전장치
   - 간단하지만 명확한 메시지 제공

3. **개발 환경 vs 프로덕션**
   - 개발: 상세한 에러 정보 표시
   - 프로덕션: 사용자 친화적 메시지 + 서버 로깅

## 🔗 참고 자료
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

**테스트 페이지**: `/error-test`에서 두 가지 에러 핸들러의 차이를 직접 확인할 수 있습니다.
