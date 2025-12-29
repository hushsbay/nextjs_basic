// 클라이언트 API 호출 유틸리티 : fetch를 래핑하여 반복적인 코드를 줄이고 일관된 API 호출 제공

interface ApiOptions extends RequestInit {
    body?: any;
    params?: Record<string, any>;
    credentials?: RequestCredentials; // 1) include 2) same-origin 3) omit (omit 옵션은 쿠키를 전송하지도, 받지도 않음)
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
    code?: string;
    [key: string]: any;
}

// 기본 fetch 래퍼 : 1) Content-Type: application/json 자동 설정 2) body 자동 JSON.stringify 3) response 자동 json() 파싱
async function apiFetch<T = any>(url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    const { body, params, headers = {}, ...restOptions } = options;
    let finalUrl = url;
    if (params) { // URL에 쿼리 파라미터 추가 (GET 요청 등에 사용)
        const queryString = new URLSearchParams(params).toString();
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
    const finalHeaders: Record<string, string> = { // 기본 헤더 설정 (Content-Type은 body가 있을 때만)
        ...(headers as Record<string, string>),
    };
    let finalBody: string | FormData | undefined;
    if (body) { // body가 있으면 JSON으로 자동 변환하고 Content-Type 설정
        if (body instanceof FormData) { // FormData는 그대로 전달 (Content-Type은 브라우저가 자동 설정)
            finalBody = body;
        } else { // 객체는 JSON으로 변환
            finalBody = JSON.stringify(body);
            finalHeaders['Content-Type'] = 'application/json';
        }
    }
    try {
        const response = await fetch(finalUrl, {
            ...restOptions,
            headers: finalHeaders,
            body: finalBody,
            credentials: options.credentials || 'same-origin',
        });
        const data = await response.json(); // JSON 응답 파싱
        if (!response.ok && !data.success) { // HTTP 에러 처리 (4xx, 5xx)
            return {
                success: false,
                message: data.message || `HTTP Error: ${response.status}`,
                error: data.error,
                code: data.code,
                ...data,
            };
        }
        return data;
    } catch (error) { // 네트워크 에러 등
        console.error('API fetch error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
            error: String(error),
        };
    }
}

// Omit<ApiOptions, 'method' | 'body'>는 사용자가 실수로 method나 body를 옵션으로 전달하는 것을 방지. 이미 함수 안에서 파라미터로 전달하기 때문임
export async function apiGet<T = any>(url: string, params?: Record<string, any>, options?: Omit<ApiOptions, 'method' | 'body' | 'params'>): Promise<ApiResponse<T>> {
    return apiFetch<T>(url, {
        ...options,
        method: 'GET',
        params,
    });
}

export async function apiPost<T = any>(url: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return apiFetch<T>(url, {
        ...options,
        method: 'POST',
        body,
    });
}

export async function apiPut<T = any>(url: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return apiFetch<T>(url, {
        ...options,
        method: 'PUT',
        body,
    });
}

export async function apiDelete<T = any>(url: string, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return apiFetch<T>(url, {
        ...options,
        method: 'DELETE',
    });
}

export async function apiPatch<T = any>(url: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return apiFetch<T>(url, {
        ...options,
        method: 'PATCH',
        body,
    });
}

// 통합 API 객체 (선호하는 방식으로 사용 가능)
export const api = { get: apiGet, post: apiPost, put: apiPut, delete: apiDelete, patch: apiPatch };
export default api;
