'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/client/api-client';
import { useAuthStore } from '@/store/useAuthStore';

function LoginForm() { // useSearchParams를 사용하는 컴포넌트를 별도로 분리

    const [userid, setUserid] = useState('');
    const [password, setPassword] = useState(''); //passport.js, next-auth 등에서 일반적으로 password라는 필드명 사용 (가급적 맞춰 사용하기로 함)
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    
    const useridInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    
    const setUser = useAuthStore((state) => state.setUser);

    // 1) 아래 빈 배열시 컴포넌트가 처음 마운트(로드)될 때 한 번만 실행됨 : 저장된 사용자ID 불러오기
    useEffect(() => {
        const savedUserid = localStorage.getItem('savedUserid');
        if (savedUserid) {
            setUserid(savedUserid);
            setRememberMe(true);
        }
    }, []);

    // 2) searchParams가 변할 때마다 URL에서 에러 메시지 가져오기
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
    }, [searchParams]);

    // 3) 포커싱 로직: userid가 비어있으면 userid에, 아니면 password에 포커싱
    useEffect(() => {
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
                // Zustand store에 사용자 정보 저장
                setUser({
                    userid: data.user.userid,
                    usernm: data.user.usernm,
                    email: data.user.email,
                });
                
                if (rememberMe) { // 사용자ID 저장 옵션 처리
                    localStorage.setItem('savedUserid', userid);
                } else {
                    localStorage.removeItem('savedUserid');
                }
                router.push('/dashboard'); // 대시보드로 이동
            } else {
                setError(data.message || '로그인에 실패했습니다.');
                // if (data.code === 'INVALID_PASSWORD') {
                //     // 비밀번호 틀림에 대한 특별 처리
                // } else if (data.code === 'USER_NOT_FOUND') {
                //     // 사용자 없음에 대한 특별 처리
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
