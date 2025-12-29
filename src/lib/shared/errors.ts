// 에러 처리 유틸리티 (서버/클라이언트 공통 사용 가능)

export class AppError extends Error {
    constructor(message: string, public statusCode: number = 500, public isOperational: boolean = true) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = '인증에 실패했습니다.') {
        super(message, 401);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = '입력 값이 유효하지 않습니다.') {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = '요청한 리소스를 찾을 수 없습니다.') {
        super(message, 404);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string = '데이터베이스 오류가 발생했습니다.') {
        super(message, 500);
    }
}

// export function normalizeErrorMessage(error: unknown): string { // 에러 메시지 정규화
//     if (error instanceof AppError) return error.message;
//     if (error instanceof Error) return error.message;
//     if (typeof error === 'string') return error;
//     return '알 수 없는 오류가 발생했습니다.';
// }

// export function getErrorDetails(error: unknown) {
//     //const isDevelopment = process.env.NODE_ENV === 'development';
//     //if (!isDevelopment) return undefined;
//     if (error instanceof Error) {
//         return { name: error.name, message: error.message, stack: error.stack };
//     }
//     return String(error);
// }
