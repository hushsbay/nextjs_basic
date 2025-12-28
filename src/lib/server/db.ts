import { Pool } from 'pg';

// Next.js도 @Transactional 같은 annotation을 지원하나요? 아니요, Next.js/Node.js는 지원하지 않습니다
// TypeScript decorator는 있지만 Spring의 @Transactional과 다릅니다. 대신 tx 같은 함수 래퍼 패턴을 사용합니다

let pool: Pool | null = null;

export function getPool(): Pool { // PostgreSQL 연결 풀 가져오기 (싱글톤 패턴)
    if (!pool) {
        const connectionString = process.env.DB_URL;
        if (!connectionString) {
            throw new Error('DB_URL environment variable is not set');
        }
        try {
            pool = new Pool({connectionString, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
            pool.on('error', (err) => { console.error('Database pool error:', err.message); });
        } catch (error) {
            throw error;
        }
    }
    return pool;
}

export async function query(text: string, params?: any[]) {
    try {
        const pool = getPool();
        const result = await pool.query(text, params);
        return result;
    } catch (error) {
        console.error('Database query error:', { text, params, error });
        if (error instanceof Error) { // 에러 메시지 개선
            if (error.message.includes('timeout')) {
                throw new Error('데이터베이스 연결 시간 초과입니다.');
            } else if (error.message.includes('Connection terminated')) {
                throw new Error('데이터베이스 연결이 종료되었습니다.');
            } else if (error.message.includes('password authentication failed')) {
                throw new Error('데이터베이스 인증 실패입니다.');
            }
        }
        throw error;
    }
}

export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        client.release();
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        throw error;
    }
}

// 1) tx 샘플 : 아래 transaction를 try catch하면 오류시 catch로 전달됨 (브라우저에게 오류가 전달 가능하게 됨)
// await transaction(async (client) => {
//     await client.query( // refreshToken 및 expiry 제거
//         'UPDATE com_user SET refresh_token = NULL, refresh_token_expiry = NULL WHERE userid = $1',
//         [userId]
//     );
//     throw new AppError("tx error") throw; new AuthenticationError("tx1 error") => test ok
//     await client.query( //updated_at 업데이트
//         'UPDATE com_user SET updated_at = now() WHERE userid = $1',
//         [userId]
//     );
// });

// 2) 조건부 롤백 샘플 : 위 1) tx 샘플에서 중간 오류 발생시 rollback 잘됨 :특별 상황 아니면 2) 조건부롤백샘플 사용할 일 거의 없을 것임
// const pool = getPool();
// const client = await pool.connect();
// try {
//     await client.query('BEGIN');
//     const result = await client.query('UPDATE...');
//     if (someCondition) {
//         await client.query('ROLLBACK');  // 원하는 위치에서 롤백
//         client.release();  // ✅ 반드시 필요!
//         return;
//     }
//     await client.query('COMMIT');
//     client.release();  // ✅ 반드시 필요!
// } catch (error) {
//     await client.query('ROLLBACK');
//     client.release();  // ✅ 반드시 필요!
//     throw error;
// }

// Next.js는 서버리스/장기 실행 서버이므로 일반적으로 closePool()을 호출하지 않습니다
// 애플리케이션 종료 시(graceful shutdown)에만 사용. Next.js는 자동으로 연결 풀을 관리하므로 신경 쓸 필요 없습니다
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
