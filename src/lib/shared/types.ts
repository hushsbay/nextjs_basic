// 공통 타입 정의

export interface User {
    userid: string;
    usernm: string;
    email: string;
    userrole?: string | null;
    lastlogin_at?: Date | null;
    created_at?: Date;
    updated_at?: Date | null;
}

export interface TokenPayload {
    userid: string;
    usernm: string;
    email: string;
}

export interface AuthResult {
    success: boolean;
    message?: string;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
}

export interface TokenRefreshResult {
    success: boolean;
    message?: string;
    accessToken?: string;
    refreshToken?: string;
}
