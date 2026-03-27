const ALLOWED_HOSTNAMES = ["myship.7-11.com.tw"];

/**
 * 驗證 URL 必須屬於賣貨便白名單 domain。
 * 合法回傳原始 URL，否則回傳 null。
 */
export function safeMyshipUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTNAMES.includes(hostname) ? url : null;
  } catch {
    return null;
  }
}
