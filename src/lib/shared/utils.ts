export function formatTimestamp(): string { // 예) 2025-12-28 14:35:42.123456
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const microseconds = String(now.getMilliseconds() * 1000).padStart(6, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${microseconds}`;
}
