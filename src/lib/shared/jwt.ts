import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { TokenPayload } from './types';

// 환경변수 안전하게 로드
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';
const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRY || '15m') as StringValue;
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as StringValue;
const REFRESH_EXPIRY_FALLBACK = 7 // 7d (days 단위가 아니면 getRefreshTokenExpiry() 변경 필요)

export function generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: ACCESS_EXPIRY };
    return jwt.sign(payload, ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: REFRESH_EXPIRY };
    return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
}

export function getRefreshTokenExpiry(): Date {
    try {
        const decoded = jwt.decode(generateRefreshToken({ userid: 'temp', usernm: 'temp', email: 'temp' })) as any;
        if (decoded && decoded.exp) {
            return new Date(decoded.exp * 1000);
        }
        return new Date(Date.now() + REFRESH_EXPIRY_FALLBACK * 24 * 60 * 60 * 1000);
    } catch (error) { // 위 아래는 fallback
        return new Date(Date.now() + REFRESH_EXPIRY_FALLBACK * 24 * 60 * 60 * 1000);
    }
}

export function getTokenExpiry(token: string): Date | null {
    try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.exp) {
            return new Date(decoded.exp * 1000);
        }
        return null;
    } catch (error) {
        return null;
    }
}

export function isTokenExpired(token: string): boolean {
    const expiry = getTokenExpiry(token);
    if (!expiry) return true;
    return expiry.getTime() < Date.now();
}
