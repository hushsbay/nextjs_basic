import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, getTokenExpiry } from '@/lib/shared/jwt';
import { query } from '@/lib/server/db';
import { refreshTokens } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;
        if (!accessToken && !refreshToken) {
            return NextResponse.json(
                { success: false, message: '인증되지 않았습니다.' },
                { status: 401 }
            );
        }
        let userId: string | null = null;
        let accessTokenExpiry: Date | null = null;
        let refreshTokenExpiry: Date | null = null;
        let wasRefreshed = false;
        if (accessToken) { // AccessToken 검증
            const payload = verifyAccessToken(accessToken);
            if (payload) {
                userId = payload.userid;
                accessTokenExpiry = getTokenExpiry(accessToken);
            }
        }
        if (!userId && refreshToken) { // AccessToken이 만료된 경우 RefreshToken으로 갱신
            const payload = verifyRefreshToken(refreshToken);
            if (!payload) {
                return NextResponse.json(
                    { success: false, message: 'RefreshToken이 유효하지 않습니다.' },
                    { status: 401 }
                );
            }
            const result = await refreshTokens(refreshToken); // 토큰 갱신
            if (!result.success) {
                return NextResponse.json(
                    { success: false, message: result.message },
                    { status: 401 }
                );
            }
            userId = payload.userid;
            wasRefreshed = true;
            accessTokenExpiry = getTokenExpiry(result.accessToken!); // 새로운 토큰의 만료일시
            refreshTokenExpiry = getTokenExpiry(result.refreshToken!);
            const isProduction = process.env.NODE_ENV === 'production';
            const response = NextResponse.json({
                success: true,
                userId,
                wasRefreshed,
                accessTokenExpiry,
                refreshTokenExpiry,
                message: '토큰이 갱신되었습니다.',
            }); // 새로운 쿠키 설정 (세션 쿠키)
            response.cookies.set('accessToken', result.accessToken!, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                path: '/',
            });
            response.cookies.set('refreshToken', result.refreshToken!, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                path: '/',
            });
            return response;
        }
        if (refreshToken) { // RefreshToken의 만료일시 (쿠키에서 직접 가져옴)
            refreshTokenExpiry = getTokenExpiry(refreshToken);
        }
        if (!userId) {
            return NextResponse.json(
                { success: false, message: '인증 실패' },
                { status: 401 }
            );
        }
        const result = await query( // DB에서 userrole 조회 - 테스트
            'SELECT userrole FROM com_user WHERE userid = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        const userrole = result.rows[0].userrole;
        return NextResponse.json({
            success: true,
            userId,
            userrole,
            wasRefreshed,
            accessTokenExpiry,
            refreshTokenExpiry,
        });
    } catch (error) {
        console.error('Token expiry test error:', error);
        const errorMessage = error instanceof Error ? error.message : '토큰 테스트 중 오류가 발생했습니다.';
        return NextResponse.json(
            { success: false, message: errorMessage, error: process.env.NODE_ENV === 'development' ? String(error) : undefined },
            { status: 500 }
        );
    }
}
