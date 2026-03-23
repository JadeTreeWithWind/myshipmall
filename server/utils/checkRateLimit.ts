/**
 * KV Rate Limit 工具函式
 * Key 格式：rate_limit:{ip}:{endpoint}:{hour_window}
 * TTL：3600 秒（1 小時後自動過期）
 */
export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  endpoint: string,
  limit: number,
): Promise<void> {
  const hour = Math.floor(Date.now() / 3_600_000)
  const key = `rate_limit:${ip}:${endpoint}:${hour}`

  const current = await kv.get(key)
  const count = current ? parseInt(current, 10) : 0

  if (count >= limit) {
    throw createError({
      statusCode: 429,
      message: `請求過於頻繁，請稍後再試（每小時限制 ${limit} 次）`,
    })
  }

  await kv.put(key, String(count + 1), { expirationTtl: 3600 })
}
