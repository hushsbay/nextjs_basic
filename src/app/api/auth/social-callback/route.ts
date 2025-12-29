import { NextRequest, NextResponse } from 'next/server';
import { getCookieOptions } from '@/lib/server/api-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accessToken, refreshToken, user } = body;
        if (!accessToken || !refreshToken || !user) {
            return NextResponse.json(
                { success: false, message: '토큰 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }
        const response = NextResponse.json({ success: true, user });
        const cookieOptions = getCookieOptions(); // 일반 로그인과 동일한 방식으로 쿠키 설정 (session cookie)
        response.cookies.set('accessToken', accessToken, cookieOptions);
        response.cookies.set('refreshToken', refreshToken, cookieOptions);
        return response;
    } catch (error) {
        console.error('Social login callback error:', error);
        return NextResponse.json(
            { success: false, message: '소셜 로그인 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
