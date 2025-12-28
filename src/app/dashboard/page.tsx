'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api-client';
import { useAuthStore } from '@/store/useAuthStore';

interface User {
    userid: string;
    usernm: string;
    email: string;
}

interface TokenInfo {
    accessTokenExpiry: string | null;
    refreshTokenExpiry: string | null;
    userrole: string | null;
}

export default function DashboardPage() {

    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const clearUser = useAuthStore((state) => state.clearUser);
    
    const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
        accessTokenExpiry: null,
        refreshTokenExpiry: null,
        userrole: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [testMessage, setTestMessage] = useState('');

    const router = useRouter();

    useEffect(() => {
        verifyAuth();
    }, []);

    const verifyAuth = async () => {
        try {
            const data = await api.get('/api/auth/verify');
            if (data.success) {
                setUser({
                    userid: data.user.userid,
                    usernm: data.user.usernm,
                    email: data.user.email,
                });
            } else {
                clearUser();
                const errorMsg = encodeURIComponent(data.message || '인증되지 않았습니다.');
                router.replace(`/login?error=${errorMsg}`);
            }
        } catch (error) {
            clearUser();
            const errorMessage = error instanceof Error ? error.message : '인증되지 않았습니다.';
            setError(errorMessage);
            const errorMsg = encodeURIComponent(errorMessage);
            router.replace(`/login?error=${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout');
            clearUser();
            router.replace('/login');
        } catch (error) {
            alert('로그아웃 처리 중 오류가 발생했습니다.');
        }
    };

    const handleTestExpiry = async () => {
        setTestMessage('토큰 만료 테스트 중...');
        try {
            const data = await api.get('/api/token_test/expiry');
            if (data.success) {
                setTokenInfo({
                    accessTokenExpiry: data.accessTokenExpiry,
                    refreshTokenExpiry: data.refreshTokenExpiry,
                    userrole: data.userrole,
                });
                if (data.wasRefreshed) {
                    setTestMessage('✓ 토큰이 갱신되었습니다!');
                } else {
                    setTestMessage('✓ 토큰이 유효합니다.');
                }
            } else {
                setTestMessage(`✗ ${data.message}`);
                if (!data.success && data.code === 'UNAUTHORIZED') {
                    setTimeout(() => {
                        const errorMsg = encodeURIComponent('토큰이 만료되었습니다. 다시 로그인해주세요.');
                        router.replace(`/login?error=${errorMsg}`);
                    }, 1500);
                }
            }
        } catch (error) {
            setTestMessage('✗ 테스트 중 오류가 발생했습니다.');
        }
    };

    const handleInvalidateToken = async () => {
        if (!confirm('토큰을 강제로 무효화하시겠습니까? 다시 로그인해야 합니다.')) {
            return;
        }
        setTestMessage('토큰 무효화 중...');        
        try {
            const data = await api.post('/api/token_test/invalidate');
            if (data.success) {
                const errorMsg = encodeURIComponent(data.message);
                router.replace(`/login?error=${errorMsg}`);
            } else {
                setTestMessage(`✗ ${data.message}`);
            }
        } catch (error) {
            setTestMessage('✗ 무효화 중 오류가 발생했습니다.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">인증 확인 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-xl font-bold text-gray-800">대시보드</h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="border-b border-gray-200 pb-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">인증 성공!</h2>
                        <p className="text-gray-600">JWT 인증이 정상적으로 처리되었습니다.</p>
                    </div>

                    {user && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800 font-semibold mb-3">✓ 로그인 사용자 정보</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-32">사용자 ID:</span>
                                        <span className="text-gray-900">{user.userid}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-32">사용자 이름:</span>
                                        <span className="text-gray-900">{user.usernm}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-32">이메일:</span>
                                        <span className="text-gray-900">{user.email}</span>
                                    </div>
                                    {tokenInfo.userrole !== null && (
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-32">사용자 역할:</span>
                                            <span className="text-gray-900">{tokenInfo.userrole || '(없음)'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-800 font-semibold mb-2">🔐 보안 설정</p>
                                <ul className="text-sm text-blue-900 space-y-1">
                                    <li>✓ AccessToken: httpOnly, secure, sameSite 쿠키</li>
                                    <li>✓ RefreshToken: httpOnly, secure, sameSite 쿠키</li>
                                    <li>✓ AccessToken 만료 시 자동 갱신</li>
                                    <li>✓ RefreshToken은 DB에 저장됨</li>
                                    <li>✓ XSS 및 CSRF 방어</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-gray-800 font-semibold mb-2">ℹ️ 테스트 안내</p>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li>• AccessToken은 1분 후 자동 만료됩니다</li>
                                    <li>• 만료 시 RefreshToken으로 자동 갱신됩니다</li>
                                    <li>• RefreshToken은 3분간 유효합니다</li>
                                    <li>• 페이지를 새로고침하여 토큰 검증을 테스트할 수 있습니다</li>
                                    <li>• 브라우저를 모두 닫으면 세션 쿠키가 삭제됩니다</li>
                                </ul>
                            </div>

                            {(tokenInfo.accessTokenExpiry || tokenInfo.refreshTokenExpiry) && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <p className="text-purple-800 font-semibold mb-3">🔍 토큰 만료 정보</p>
                                    <div className="space-y-2 text-sm">
                                        {tokenInfo.accessTokenExpiry && (
                                            <div className="flex">
                                                <span className="font-medium text-gray-700 w-40">AccessToken 만료:</span>
                                                <span className="text-gray-900">{new Date(tokenInfo.accessTokenExpiry).toLocaleString('ko-KR')}</span>
                                            </div>
                                        )}
                                        {tokenInfo.refreshTokenExpiry && (
                                            <div className="flex">
                                                <span className="font-medium text-gray-700 w-40">RefreshToken 만료:</span>
                                                <span className="text-gray-900">{new Date(tokenInfo.refreshTokenExpiry).toLocaleString('ko-KR')}</span>
                                            </div>
                                        )}
                                        {tokenInfo.userrole !== null && (
                                            <div className="flex">
                                                <span className="font-medium text-gray-700 w-40">사용자 역할:</span>
                                                <span className="text-gray-900">{tokenInfo.userrole || '(없음)'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {testMessage && (
                                <div className={`border rounded-lg p-4 ${testMessage.startsWith('✓')
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : testMessage.startsWith('✗')
                                            ? 'bg-red-50 border-red-200 text-red-800'
                                            : 'bg-blue-50 border-blue-200 text-blue-800'
                                    }`}>
                                    <p className="font-medium">{testMessage}</p>
                                </div>
                            )}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800 font-semibold mb-3">🧪 토큰 테스트</p>
                                <div className="space-y-2">
                                    <button
                                        onClick={handleTestExpiry}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
                                    >
                                        토큰 만료 테스트 (userrole 조회 + 토큰 검증/갱신)
                                    </button>
                                    <button
                                        onClick={handleInvalidateToken}
                                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium"
                                    >
                                        토큰 강제 무효화 (DB에서 RefreshToken 삭제)
                                    </button>
                                    <p className="text-xs text-yellow-700 mt-2">
                                        * 토큰 만료 테스트: AT/RT 검증 및 자동 갱신 로직 확인<br />
                                        * 강제 무효화: DB에서 RT 제거 후 재로그인 필요</p>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <p className="text-purple-800 font-semibold mb-3">🔍 에러 핸들링 테스트</p>
                                <div className="space-y-2">
                                    <a
                                        href="/error-test"
                                        className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200 text-sm font-medium text-center"
                                    >
                                        error.tsx vs global-error.tsx 테스트 페이지
                                    </a>
                                    <p className="text-xs text-purple-700 mt-2">
                                        * 일반 에러와 글로벌 에러의 차이점을 확인할 수 있습니다
                                    </p>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
