import bcrypt from 'bcrypt';
import { query } from './db';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../shared/jwt';
import type { AuthResult, TokenRefreshResult, TokenPayload } from '../shared/types';

interface UserRow {
    userid: string;
    usernm: string;
    pwd: string;
    email: string;
    refresh_token?: string | null;
    refresh_token_expiry?: Date | null;
    userrole?: string | null;
    lastlogin_at?: Date | null;
    created_at?: Date;
    updated_at?: Date | null;
}

/**
 * 사용자 인증 (로그인)
 * @param userid - 사용자 ID
 * @param password - 비밀번호
 * @returns 인증 결과 (성공 시 토큰 포함)
 */
export async function authenticateUser(userid: string, password: string): Promise<AuthResult> { 
    try {
        const result = await query( // 사용자 조회
            'SELECT userid, usernm, pwd, email, userrole FROM com_user WHERE userid = $1',
            [userid]
        );
        if (result.rows.length === 0) {
            return { success: false, message: '사용자를 찾을 수 없습니다.' };
        }
        const user: UserRow = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.pwd); // 비밀번호 검증
        if (!isPasswordValid) {
            return { success: false, message: '비밀번호가 일치하지 않습니다.' };
        }
        const tokenPayload: TokenPayload = { // JWT 생성
            userid: user.userid,
            usernm: user.usernm,
            email: user.email,
        };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        const refreshTokenExpiry = getRefreshTokenExpiry();
        await query( // RefreshToken을 DB에 저장
            'UPDATE com_user SET refresh_token = $1, refresh_token_expiry = $2, lastlogin_at = NOW() WHERE userid = $3',
            [refreshToken, refreshTokenExpiry, user.userid]
        );
        return {
            success: true,
            user: {
                userid: user.userid,
                usernm: user.usernm,
                email: user.email,
                userrole: user.userrole,
            },
            accessToken,
            refreshToken,
        };
    } catch (error) {
        console.error('Authentication error:', error);
        const errorMessage = error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.';
        return { success: false, message: errorMessage };
    }
}

/**
 * Refresh Token으로 토큰 갱신 : accessToken 갱신시 refreshToken도 같이 갱신
 * @param refreshToken - Refresh Token
 * @returns 갱신 결과 (성공 시 새 토큰 포함)
 */
export async function refreshTokens(refreshToken: string): Promise<TokenRefreshResult> {
    try {
        const result = await query( // DB에서 refreshToken 확인
            'SELECT userid, usernm, email, refresh_token, refresh_token_expiry FROM com_user WHERE refresh_token = $1',
            [refreshToken]
        );
        if (result.rows.length === 0) {
            return { success: false, message: 'Invalid refresh token' };
        }
        const user: UserRow = result.rows[0];
        if (new Date(user.refresh_token_expiry!) < new Date()) { // 만료 확인
            return { success: false, message: 'Refresh token expired' };
        }
        const tokenPayload: TokenPayload = { // 새로운 토큰 생성
            userid: user.userid,
            usernm: user.usernm,
            email: user.email,
        };
        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);
        const newRefreshTokenExpiry = getRefreshTokenExpiry();
        await query( // 새 RefreshToken을 DB에 저장
            'UPDATE com_user SET refresh_token = $1, refresh_token_expiry = $2 WHERE userid = $3',
            [newRefreshToken, newRefreshTokenExpiry, user.userid]
        );
        return {
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    } catch (error) {
        console.error('Token refresh error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
        return { success: false, message: errorMessage };
    }
}

export async function logoutUser(userid: string): Promise<void> {
    await query(
        'UPDATE com_user SET refresh_token = NULL, refresh_token_expiry = NULL WHERE userid = $1',
        [userid]
    );
}

/**
 * 비밀번호 해싱
 * @param password - 평문 비밀번호
 * @returns 해싱된 비밀번호
  */
export function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

/**
 * 비밀번호 검증
 * @param password - 평문 비밀번호
 * @param hashedPassword - 해싱된 비밀번호
 * @returns 일치 여부
  */
export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}
