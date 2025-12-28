'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // 에러를 콘솔에 로깅
        console.error('Global error caught:', error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
            <div className="w-full max-w-2xl">
                <div className="bg-white shadow-2xl rounded-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h1>
                        <p className="text-gray-600">예기치 않은 오류가 발생했습니다. 다시 시도해주세요.</p>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-800 mb-2">개발 모드 - 에러 정보:</p>
                            <div className="text-xs text-red-700 font-mono overflow-auto max-h-60">
                                <p className="font-bold mb-1">{error.name}</p>
                                <p className="mb-2">{error.message}</p>
                                {error.stack && (
                                    <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                                )}
                                {error.digest && (
                                    <p className="mt-2">
                                        <span className="font-semibold">Digest:</span> {error.digest}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={reset}
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
                        >
                            홈으로 이동
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>💡 문제가 계속되면:</strong>
                        </p>
                        <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                            <li>페이지를 새로고침하거나 브라우저를 재시작해보세요</li>
                            <li>로그인 세션이 만료되었을 수 있으니 다시 로그인해보세요</li>
                            <li>브라우저 콘솔(F12)에서 자세한 에러 정보를 확인하세요</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
