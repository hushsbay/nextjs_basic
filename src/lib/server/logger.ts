import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { NextRequest } from 'next/server';
import { formatTimestamp } from '../shared/utils';
import { getClientIP, getCallerFunctionName } from './api-utils';

type LogTarget = 'F' | 'T' | 'B'; // File, Terminal, Both

const LOG_DIR = path.join(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) { // 로그 디렉토리 생성
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getDailyLogPath(): string { // 현재 날짜를 기준으로 로그 파일 경로 생성 (하루 단위)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(LOG_DIR, `app-${year}-${month}-${day}.log`);
}

const dailyLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: false, // 커스텀 타임스탬프 사용
    base: null, // pid, hostname 제거
    formatters: {
        level(label, number) {
            return {}; // level 숫자 제거 (커스텀 level 필드 사용)
        },
    },
}, pino.destination({
    dest: getDailyLogPath(),
    sync: false,
    mkdir: true,
}));

/**
 * 에러 로깅 : try-catch의 catch 블록에서 사용
 * @param error - Error 객체 또는 에러 메시지
 * @param additionalInfo - 추가 정보 (선택)
 * @param request - NextRequest 객체 (IP 추출용, 선택)
 * @param target - 로깅 대상: 'F'(파일만), 'T'(터미널만), 'B'(둘다, 기본값)
 * @param title - 함수명 수동 지정 (선택, unknown일 때 사용)
 */
export function logError(error: unknown, additionalInfo?: Record<string, any>, request?: NextRequest, target: LogTarget = 'B', title?: string) {
    const ts = formatTimestamp();
    const functionName = title || getCallerFunctionName();
    const clientIP = getClientIP(request);
    const errorObj = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
    const logData = { ts, function: functionName, clientIP, error: errorObj, ...additionalInfo };
    const logMessage = `[ERROR] [${functionName}] ${errorObj.message}`;
    if (target === 'F' || target === 'B') {
        dailyLogger.error(logData, logMessage);
    }
    if (target === 'T' || target === 'B') {
        console.error(logMessage, logData);
    }
}

/**
 * 정보 로깅
 * @param message - 로그 메시지
 * @param data - 추가 데이터 (선택)
 * @param request - NextRequest 객체 (IP 추출용, 선택)
 * @param target - 로깅 대상: 'F'(파일만), 'T'(터미널만), 'B'(둘다, 기본값)
 */
export function logInfo(message: string, data?: Record<string, any>, request?: NextRequest, target: LogTarget = 'B') {
    const ts = formatTimestamp();
    const clientIP = getClientIP(request);
    const logData = { ts, clientIP, ...data };
    const logMessage = `[INFO] ${message}`;
    if (target === 'F' || target === 'B') {
        dailyLogger.info(logData, logMessage);
    }
    if (target === 'T' || target === 'B') {
        console.log(logMessage, logData);
    }
}

export default {
    error: logError,
    info: logInfo,
};
