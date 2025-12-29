import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/shared/jwt';
import { transaction } from '@/lib/server/db';
import { logInfo } from '@/lib/server/logger';
import { responseCatchedError } from '@/lib/server/api-utils';

export async function POST(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;
        if (!accessToken && !refreshToken) {
            return NextResponse.json(
                { success: false, message: '인증되지 않았습니다.' },
                { status: 401 }
            );
        }
        // 현재 사용자 확인
        let userId: string | null = null;
        if (accessToken) {
            const payload = verifyAccessToken(accessToken);
            if (payload) {
                userId = payload.userid;
            }
        }
        if (!userId && refreshToken) {
            const payload = verifyRefreshToken(refreshToken);
            if (payload) {
                userId = payload.userid;
            }
        }
        if (!userId) {
            return NextResponse.json(
                { success: false, message: '사용자를 확인할 수 없습니다.' },
                { status: 401 }
            );
        }
        logInfo('토큰 무효화 시작', { userId }, request);
        await transaction(async (client) => { // refreshToken 제거 및 updated_at 업데이트
            await client.query(
                'UPDATE com_user SET refresh_token = NULL, refresh_token_expiry = NULL WHERE userid = $1',
                [userId]
            ); // throw new AppError("tx error"); throw new AuthenticationError("tx1 error") => test ok
            await client.query( //update row가 0개여도 오류는 아님
                'UPDATE com_user SET updated_at = now() WHERE userid = $1',
                [userId]
            );
        });
        logInfo('토큰 무효화 완료', { userId }, request);        
        const response = NextResponse.json({
            success: true,
            message: '토큰이 무효화되었습니다. 다시 로그인해주세요.',
        });
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        return response;
    } catch (error) {
        return responseCatchedError(error, '토큰 무효화 중 오류가 발생했습니다.', request, {
            hasAccessToken: !!request.cookies.get('accessToken')?.value,
            hasRefreshToken: !!request.cookies.get('refreshToken')?.value,
        }, 'token_test>invalidate');
    }
}
