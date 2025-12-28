import { NextRequest, NextResponse } from 'next/server';
import { AppError, getErrorDetails, normalizeErrorMessage, AuthenticationError } from '../shared/errors';
import { logError } from './logger';

// API 라우트용 에러 핸들러
export function handleApiError(error: unknown, context: string = 'API') {
    console.error(`[${context}] Error:`, error);
    let statusCode = 500;
    let message = '서버 오류가 발생했습니다.';
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    } else {
        message = normalizeErrorMessage(error);
        // 특정 에러 메시지 패턴에 따른 상태 코드 설정
        if (message.includes('unauthorized') || message.includes('인증')) {
            statusCode = 401;
        } else if (message.includes('not found') || message.includes('찾을 수 없')) {
            statusCode = 404;
        } else if (message.includes('invalid') || message.includes('유효하지')) {
            statusCode = 400;
        }
    }
    return NextResponse.json({ success: false, message, error: getErrorDetails(error) }, { status: statusCode });
}

// 예) const body = await safeJsonParse(request, { userid: '', password: '' });
export async function safeJsonParse<T>(request: Request, defaultValue: T): Promise<T> {
    try {
        return await request.json();
    } catch (error) {
        console.warn('JSON parsing failed, using default value:', error);
        return defaultValue;
    }
}

export function getEnvVar(key: string, defaultValue: string = ''): string {
    const value = process.env[key];
    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value || defaultValue;
}

export function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
        path: '/',
    };
}

/**
 * 클라이언트 IP 추출 (프록시 고려)
 * Next.js 서버 전용
 * 
 * @param request - NextRequest 객체
 * @returns 클라이언트 IP 주소
 */
export function getClientIP(request?: NextRequest): string {
    if (!request) return 'unknown';
    
    // 프록시 헤더 확인
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }
    
    return request.ip || 'unknown';
}

/**
 * 함수 호출 스택에서 파일 경로와 함수명 추출
 * Next.js 서버 전용 (Node.js Error.stack 사용)
 * 
 * @returns "app>api>token_test>invalidate>route.ts>POST" 형식
 */
export function getCallerFunctionName(): string {
    const error = new Error();
    const stack = error.stack?.split('\n');
    
    if (!stack) return 'unknown';
    
    // 헬퍼 함수 리스트
    const helperFunctions = ['responseCatchedError', 'logError', 'logInfo', 'getCallerFunctionName', 'getClientIP'];
    
    let fallbackResult: string | null = null;
    
    // 스택을 탐색하여 실제 호출자 찾기
    for (let i = 1; i < stack.length; i++) {
        const line = stack[i].trim();
        
        // Windows 경로: at functionName (C:\path\file.ts:line:col)
        // Unix 경로: at functionName (/path/file.ts:line:col)
        // 익명 함수: at Object.<anonymous> (path:line:col)
        const match = line.match(/at\s+(?:async\s+)?(\S+)\s+\((.+?):(\d+):(\d+)\)/);
        
        if (match) {
            const funcName = match[1];
            const filePath = match[2];
            
            // 헬퍼 함수는 스킵
            if (helperFunctions.some(helper => funcName.includes(helper))) {
                continue;
            }
            
            // src 이후 경로만 추출
            const srcIndex = filePath.indexOf('src');
            if (srcIndex !== -1) {
                let relativePath = filePath.substring(srcIndex + 4); // 'src/' 제거
                
                // 백슬래시를 >로 변경
                relativePath = relativePath.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '>');
                
                // 함수명 정리 (Object.<anonymous> 등 제거)
                let cleanFuncName = funcName;
                if (funcName.includes('.')) {
                    const parts = funcName.split('.');
                    cleanFuncName = parts[parts.length - 1];
                }
                
                // <anonymous>는 함수명에서 제거
                if (cleanFuncName === '<anonymous>' || cleanFuncName === 'anonymous') {
                    // fallback으로 파일명만 저장
                    if (!fallbackResult) {
                        fallbackResult = relativePath;
                    }
                    continue;
                }
                
                return `${relativePath}>${cleanFuncName}`;
            } else if (filePath) {
                // src가 없어도 파일 경로가 있으면 마지막 폴더/파일명만 추출
                const pathParts = filePath.replace(/\\/g, '/').split('/');
                const lastTwoParts = pathParts.slice(-2).join('>');
                
                let cleanFuncName = funcName;
                if (funcName.includes('.')) {
                    const parts = funcName.split('.');
                    cleanFuncName = parts[parts.length - 1];
                }
                
                if (cleanFuncName !== '<anonymous>' && cleanFuncName !== 'anonymous') {
                    if (!fallbackResult) {
                        fallbackResult = `${lastTwoParts}>${cleanFuncName}`;
                    }
                } else {
                    if (!fallbackResult) {
                        fallbackResult = lastTwoParts;
                    }
                }
            }
        }
    }
    
    return fallbackResult || 'unknown';
}

/**
 * catch 블록에서 에러를 처리하고 로깅 및 응답을 자동으로 반환하는 헬퍼 함수
 * 
 * @param error - catch된 에러 객체
 * @param defaultMessage - 기본 에러 메시지 (error가 Error 객체가 아닐 때 사용)
 * @param request - NextRequest 객체 (IP 추출용, 선택)
 * @param additionalInfo - 추가 로그 정보 (선택)
 * @param title - 함수명 수동 지정 (선택, unknown일 때 사용)
 * @returns NextResponse 객체
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *     try {
 *         // 비즈니스 로직
 *     } catch (error) {
 *         return responseCatchedError(error, '토큰 무효화 중 오류가 발생했습니다.', request);
 *     }
 * }
 * ```
 */
export function responseCatchedError(
    error: unknown,
    defaultMessage: string,
    request?: NextRequest,
    additionalInfo?: Record<string, any>,
    title?: string
): NextResponse {
    // 에러 로깅 (파일+터미널 둘다)
    logError(error, additionalInfo, request, 'B', title);
    
    // 에러 메시지 추출
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    
    // 상태 코드 결정 (AuthenticationError는 401, 나머지는 500)
    const statusCode = error instanceof AuthenticationError ? 401 : 500;
    
    // 응답 반환
    return NextResponse.json(
        { 
            success: false, 
            message: errorMessage, 
            error: String(error) 
        },
        { status: statusCode }
    );
}
