import { NextRequest, NextResponse } from 'next/server';
import { getCookieOptions } from '@/lib/server/api-utils';

export async function POST(request: NextRequest) {
    const response = NextResponse.json({
        success: true,
        message: '로그아웃되었습니다.'
    });
    // 쿠키 삭제 (같은 옵션으로 설정해야 제대로 삭제됨)
    const cookieOptions = getCookieOptions();
    response.cookies.set('accessToken', '', { ...cookieOptions, maxAge: 0 });
    response.cookies.set('refreshToken', '', { ...cookieOptions, maxAge: 0 });
    return response;
}
