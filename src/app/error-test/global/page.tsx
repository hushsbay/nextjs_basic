'use client';

import { useEffect } from 'react';

export default function GlobalErrorTestPage() {
    // 클라이언트에서만 에러 발생 (빌드 시 prerender 방지)
    useEffect(() => {
        throw new Error('이것은 global-error.tsx를 테스트하기 위한 에러입니다!');
    }, []);
    
    return <div>에러 테스트 페이지 로딩 중...</div>;
}
