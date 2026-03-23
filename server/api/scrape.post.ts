import { verifyTurnstile } from '../utils/verifyTurnstile'
import { checkRateLimit } from '../utils/checkRateLimit'
import { scrapeMyship, validateMyshipUrl, hashUrl } from '../utils/scrapeMyship'

export default defineEventHandler(async (event) => {
  const { cloudflare } = event.context

  if (!cloudflare?.env?.SCRAPE_CACHE || !cloudflare?.env?.RATE_LIMIT) {
    throw createError({ statusCode: 500, message: 'KV binding 未設定，請確認 Cloudflare 部署設定' })
  }

  const scrapeCache = cloudflare.env.SCRAPE_CACHE as KVNamespace
  const rateLimit = cloudflare.env.RATE_LIMIT as KVNamespace

  const body = await readBody(event)
  const { url, turnstile_token } = body ?? {}

  if (!url || !turnstile_token) {
    throw createError({ statusCode: 400, message: '缺少必要欄位：url 或 turnstile_token' })
  }

  // 1. 驗證 Turnstile
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  await verifyTurnstile(turnstile_token, ip)

  // 2. Rate Limit（每 IP 每小時 10 次）
  await checkRateLimit(rateLimit, ip, 'scrape', 10)

  // 3. 驗證網址格式
  validateMyshipUrl(url)

  // 4. 抓取並解析
  const shopData = await scrapeMyship(url)

  // 5. 存入 KV（TTL 10 分鐘）
  const cacheKey = `scrape:${await hashUrl(url)}`
  await scrapeCache.put(cacheKey, JSON.stringify(shopData), { expirationTtl: 600 })

  // 6. 回傳預覽資料
  return shopData
})
