'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/useAuthStore';
import Cookies from 'js-cookie';

export default function AuthCallbackPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const setUser = useAuthStore((state) => state.setUser);

    useEffect(() => {
        if (status === 'loading') {
            return; // 로딩 중에는 아무것도 하지 않음
        }

        if (status === 'authenticated' && session) {
            try {
                // NextAuth 세션에서 자체 JWT 토큰 추출
                const accessToken = (session as any).customAccessToken;
                const refreshToken = (session as any).customRefreshToken;
                const user = session.user as any;

                if (accessToken && refreshToken && user) {
                    // 쿠키에 토큰 저장
                    Cookies.set('accessToken', accessToken, {
                        expires: 1/96, // 15분 (1/96일)
                        path: '/',
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                    });
                    
                    Cookies.set('refreshToken', refreshToken, {
                        expires: 7, // 7일
                        path: '/',
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                    });

                    // Zustand store에 사용자 정보 저장
                    setUser({
                        userid: user.userid,
                        usernm: user.usernm,
                        email: user.email,
                    });

                    // 대시보드로 리다이렉트
                    router.push('/dashboard');
                } else {
                    console.error('Token not found in session');
                    router.push('/login?error=' + encodeURIComponent('소셜 로그인에 실패했습니다.'));
                }
            } catch (error) {
                console.error('Auth callback error:', error);
                router.push('/login?error=' + encodeURIComponent('인증 처리 중 오류가 발생했습니다.'));
            }
        } else if (status === 'unauthenticated') {
            router.push('/login?error=' + encodeURIComponent('인증에 실패했습니다.'));
        }
    }, [session, status, router, setUser]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                <p className="text-gray-700 text-lg">로그인 처리 중...</p>
            </div>
        </div>
    );
}
