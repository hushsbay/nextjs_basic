import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/shared/jwt';
import { refreshTokens } from '@/lib/server/auth';
import { getCookieOptions } from '@/lib/server/api-utils';
import { AuthenticationError } from '@/lib/shared/errors';

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;
        if (!accessToken && !refreshToken) {
            throw new AuthenticationError('인증되지 않았습니다.');
        }
        if (accessToken) {
            const payload = verifyAccessToken(accessToken);
            if (payload) {
                return NextResponse.json({ success: true, user: payload }); //현재 모듈은 MVP 모델이므로 여기서 테스트한 것임
            }
        }
        if (refreshToken) { // AccessToken이 만료된 경우 RefreshToken으로 갱신
            const payload = verifyRefreshToken(refreshToken);
            if (!payload) {
                throw new AuthenticationError('RefreshToken이 유효하지 않습니다.');
            }
            const result = await refreshTokens(refreshToken); // 토큰 갱신
            if (!result.success) {
                throw new AuthenticationError(result.message || '토큰 갱신에 실패했습니다.');
            }
            const response = NextResponse.json({ success: true, user: payload, refreshed: true });
            const cookieOptions = getCookieOptions(); // 새로운 쿠키 설정
            response.cookies.set('accessToken', result.accessToken!, cookieOptions);
            response.cookies.set('refreshToken', result.refreshToken!, cookieOptions);
            return response; //현재 모듈은 MVP 모델이므로 여기서 테스트한 것임
        }
        throw new AuthenticationError('인증 실패');
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : '인증 실패'
        }, { status: 401 });
    }
}
