import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/shared/jwt';
import { refreshTokens } from '@/lib/server/auth';
import { getCookieOptions } from '@/lib/server/api-utils';
import { AuthenticationError } from '@/lib/shared/errors';

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;
        // 토큰이 없으면 인증 실패
        if (!accessToken && !refreshToken) {
            throw new AuthenticationError('인증되지 않았습니다.');
        }
        // AccessToken 검증
        if (accessToken) {
            const payload = verifyAccessToken(accessToken);
            if (payload) {
                return NextResponse.json({
                    success: true,
                    user: payload,
                });
            }
        }
        // AccessToken이 만료된 경우 RefreshToken으로 갱신
        if (refreshToken) {
            const payload = verifyRefreshToken(refreshToken);
            if (!payload) {
                throw new AuthenticationError('RefreshToken이 유효하지 않습니다.');
            }
            // 토큰 갱신 (비즈니스 로직은 lib에서)
            const result = await refreshTokens(refreshToken);
            if (!result.success) {
                throw new AuthenticationError(result.message || '토큰 갱신에 실패했습니다.');
            }
            // 새로운 쿠키 설정
            const cookieOptions = getCookieOptions();
            const response = NextResponse.json({
                success: true,
                user: payload,
                refreshed: true,
            });
            response.cookies.set('accessToken', result.accessToken!, cookieOptions);
            response.cookies.set('refreshToken', result.refreshToken!, cookieOptions);
            return response;
        }
        throw new AuthenticationError('인증 실패');
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : '인증 실패',
                shouldRedirect: true
            },
            { status: 401 }
        );
    }
}
