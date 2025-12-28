namespace NodeJS {
    interface ProcessEnv {
        JWT_ACCESS_SECRET: string;
        JWT_REFRESH_SECRET: string;
        JWT_ACCESS_EXPIRY: string;
        JWT_REFRESH_EXPIRY: string;
        DB_URL: string;
        NODE_ENV: 'development' | 'production' | 'test';
    }
}
