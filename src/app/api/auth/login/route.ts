import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/server/auth';
import { handleApiError, safeJsonParse, getCookieOptions } from '@/lib/server/api-utils';
import { ValidationError } from '@/lib/shared/errors';

export async function POST(request: NextRequest) {
    try {
        const body = await safeJsonParse(request, { userid: '', password: '' });
        const { userid, password } = body;
        if (!userid || !password) {
            throw new ValidationError('사용자ID와 비밀번호를 입력해주세요.');
        }
        const result = await authenticateUser(userid, password);
        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message }, { status: 401 });
        }
        const response = NextResponse.json({ success: true,
            user: result.user
        });
        const cookieOptions = getCookieOptions();
        response.cookies.set('accessToken', result.accessToken!, cookieOptions);
        response.cookies.set('refreshToken', result.refreshToken!, cookieOptions);
        return response;
    } catch (error) {
        return handleApiError(error, 'Login');
    }
}
