'use client';

import { useState } from 'react';

export default function ErrorTestPage() {
    const [shouldThrow, setShouldThrow] = useState(false);

    if (shouldThrow) {
        // 일반 컴포넌트 에러 발생 - error.tsx가 캐치
        throw new Error('이것은 일반 컴포넌트 에러입니다! error.tsx가 이 에러를 캐치합니다.');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">
                    Error Boundary 테스트
                </h1>

                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        1️⃣ error.tsx 테스트 (일반 컴포넌트 에러)
                    </h2>
                    <p className="text-gray-600 mb-4">
                        이 버튼을 클릭하면 현재 페이지에서 에러가 발생하고, <strong>error.tsx</strong>가 에러를 캐치합니다.
                    </p>
                    <button
                        onClick={() => setShouldThrow(true)}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-200"
                    >
                        일반 에러 발생시키기 (error.tsx)
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        2️⃣ global-error.tsx 테스트 (루트 레이아웃 에러)
                    </h2>
                    <p className="text-gray-600 mb-4">
                        아래 링크로 이동하면 루트 레이아웃에서 에러가 발생하고, <strong>global-error.tsx</strong>가 에러를 캐치합니다.
                    </p>
                    <a
                        href="/error-test/global"
                        className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition duration-200"
                    >
                        글로벌 에러 페이지로 이동 (global-error.tsx)
                    </a>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-blue-900 mb-3">
                        📚 error.tsx vs global-error.tsx 차이점
                    </h3>
                    <div className="space-y-4 text-sm text-blue-800">
                        <div>
                            <h4 className="font-bold mb-1">🟦 error.tsx</h4>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>해당 라우트 세그먼트와 그 하위 세그먼트의 에러를 캐치</li>
                                <li>일반적인 컴포넌트 렌더링 에러 처리</li>
                                <li>레이아웃은 유지되고 에러 컴포넌트만 표시됨</li>
                                <li>대부분의 에러는 이것으로 처리됨</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-1">🟥 global-error.tsx</h4>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>루트 레이아웃(layout.tsx)에서 발생한 에러를 캐치</li>
                                <li>전체 애플리케이션의 최상위 에러 경계</li>
                                <li>&lt;html&gt;과 &lt;body&gt; 태그를 포함해야 함 (레이아웃도 에러 발생했으므로)</li>
                                <li>프로덕션 환경에서는 매우 드물게 발생하는 심각한 에러 처리</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <a
                        href="/dashboard"
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
                    >
                        ← 대시보드로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    );
}
