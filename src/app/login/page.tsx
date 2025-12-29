'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { api } from '@/lib/client/api-client';
import { useAuthStore } from '@/store/useAuthStore';

function LoginForm() { // useSearchParams를 사용하는 컴포넌트를 별도로 분리

    const setUser = useAuthStore((state) => state.setUser);
    const [userid, setUserid] = useState('');
    const [password, setPassword] = useState(''); //passport.js, next-auth 등에서 일반적으로 password라는 필드명 사용 (가급적 맞춰 사용하기로 함)
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    
    const useridInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { // 1) 아래 빈 배열시 컴포넌트가 처음 마운트(로드)될 때 한 번만 실행됨 : 저장된 사용자ID 불러오기
        const savedUserid = localStorage.getItem('savedUserid');
        if (savedUserid) {
            setUserid(savedUserid);
            setRememberMe(true);
        }
    }, []);

    useEffect(() => { // 2) searchParams가 변할 때마다 URL에서 에러 메시지 가져오기
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
    }, [searchParams]);

    useEffect(() => { // 3) 포커싱 로직: userid가 비어있으면 userid에, 아니면 password에 포커싱
        if (userid.trim() === '') {
            useridInputRef.current?.focus();
        } else {
            passwordInputRef.current?.focus();
        }
    }, [userid]);

    const handleSubmit = async (e: React.FormEvent) => {        
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const data = await api.post('/api/auth/login', { userid, password });
            if (data.success) {
                setUser({ userid: data.user.userid, usernm: data.user.usernm, email: data.user.email }); // Zustand store에 사용자 정보 저장
                if (rememberMe) { // 사용자ID 저장 옵션 처리
                    localStorage.setItem('savedUserid', userid);
                } else {
                    localStorage.removeItem('savedUserid');
                }
                router.replace('/dashboard'); // 대시보드로 이동
            } else {
                setError(data.message || '로그인에 실패했습니다.');
                // if (data.code === 'INVALID_PASSWORD') { // 비밀번호 틀림에 대한 특별 처리
                // } else if (data.code === 'USER_NOT_FOUND') { // 사용자 없음에 대한 특별 처리
                // }
                console.error('Login error details:', data.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('로그인 처리 중 네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-2xl rounded-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">로그인</h1>
                        {/* <p className="text-gray-500 mt-2">계정에 로그인하세요</p> */}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        <div>
                            <label htmlFor="userid" className="block text-sm font-medium text-gray-700 mb-2">
                                사용자 ID
                            </label>
                            <input
                                ref={useridInputRef}
                                type="text"
                                id="userid"
                                value={userid}
                                onChange={(e) => setUserid(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900"
                                placeholder="사용자 ID 입력"
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <input
                                ref={passwordInputRef}
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900"
                                placeholder="비밀번호를 입력하세요"
                                required
                                autoComplete="new-password" // autoComplete="current-password" //form 전체 기본은 autoComplete="off"로 처리
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                                사용자 ID 저장
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    {/* 구분선 */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">또는</span>
                        </div>
                    </div>

                    {/* signIn => app>api>auth>[..nextauth]>route.ts => app>auth>callback>page.tsx => app>api>auth>social-callback */}
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => signIn('google', { callbackUrl: '/auth/callback' })}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-200"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>구글로 로그인</span>
                        </button>

                        {/* 현재 AcessDenied 발생 => 원인은 카카오 이메일 관련 동의 처리 안되서 그런 듯하나 원인 파악 안되고 있어 일단 막음)
                        <button
                            type="button"
                            onClick={() => signIn('kakao', { callbackUrl: '/auth/callback' })}
                            className="w-full flex items-center justify-center gap-3 bg-yellow-400 text-gray-900 py-3 rounded-lg font-medium hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition duration-200"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                            </svg>
                            <span>카카오로 로그인</span>
                        </button> */}
                    </div>
                </div>

                {/* <p className="text-center text-gray-600 text-sm mt-6">
                    테스트 환경입니다. DB 연결 후 사용 가능합니다.
                </p> */}
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>로딩 중...</div>}>
            <LoginForm />
        </Suspense>
    );
}
