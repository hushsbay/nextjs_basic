'use client';

export default function GlobalErrorTestPage() {
    // 이 페이지가 로드되면 즉시 에러 발생
    throw new Error('이것은 global-error.tsx를 테스트하기 위한 에러입니다!');

    return null;
}
