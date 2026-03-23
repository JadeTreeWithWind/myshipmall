// C1-3 驗證：Rate Limit 正確攔截
// 使用專屬測試 IP，呼叫 checkRateLimit 超過限制次數，確認回傳 429
// 測試完後自動清除測試用 KV key
import { checkRateLimit } from '../utils/checkRateLimit'

export default defineEventHandler(async (event) => {
  const { cloudflare } = event.context

  if (!cloudflare?.env?.RATE_LIMIT) {
    return { pass: false, reason: 'RATE_LIMIT KV binding 不可用' }
  }

  const kv = cloudflare.env.RATE_LIMIT as KVNamespace
  const testIp = 'TEST_IP_C1_3_DO_NOT_USE'
  const results: Record<string, unknown> = {}

  // 先清除可能殘留的測試 key（以防萬一）
  const hour = Math.floor(Date.now() / 3_600_000)
  const scrapeKey = `rate_limit:${testIp}:scrape:${hour}`
  const confirmKey = `rate_limit:${testIp}:confirm-import:${hour}`
  await kv.delete(scrapeKey)
  await kv.delete(confirmKey)

  // 測試 scrape limit（限 10 次）
  try {
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(kv, testIp, 'scrape', 10)
    }
    // 第 11 次應該被擋
    try {
      await checkRateLimit(kv, testIp, 'scrape', 10)
      results.scrape_limit = { pass: false, reason: '第 11 次應該回傳 429，但沒有' }
    } catch (err: any) {
      results.scrape_limit = {
        pass: err.statusCode === 429,
        status: err.statusCode,
        message: err.message,
      }
    }
  } catch (err: any) {
    results.scrape_limit = { pass: false, reason: `前 10 次就被擋了：${err.message}` }
  }

  // 測試 confirm-import limit（限 5 次）
  try {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(kv, testIp, 'confirm-import', 5)
    }
    try {
      await checkRateLimit(kv, testIp, 'confirm-import', 5)
      results.confirm_limit = { pass: false, reason: '第 6 次應該回傳 429，但沒有' }
    } catch (err: any) {
      results.confirm_limit = {
        pass: err.statusCode === 429,
        status: err.statusCode,
        message: err.message,
      }
    }
  } catch (err: any) {
    results.confirm_limit = { pass: false, reason: `前 5 次就被擋了：${err.message}` }
  }

  // 清除測試 key
  await kv.delete(scrapeKey)
  await kv.delete(confirmKey)

  const allPass = Object.values(results).every((r: any) => r.pass)

  return {
    checkpoint: 'C1-3',
    description: 'Rate Limit 正確攔截',
    pass: allPass,
    results,
  }
})
