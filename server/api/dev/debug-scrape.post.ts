// ⚠️ DEV ONLY — 部署後應手動移除或加 env guard
export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  const { url } = await readBody<{ url: string }>(event)
  if (!url) throw createError({ statusCode: 400, message: 'url required' })

  const html = await $fetch<string>(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    },
    responseType: 'text',
  })

  // 檢查 __NEXT_DATA__
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  )
  let nextDataKeys: string[] | null = null
  let nextDataPagePropsKeys: string[] | null = null
  let nextDataSample: unknown = null
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1])
      nextDataKeys = Object.keys(nd)
      nextDataPagePropsKeys = Object.keys(nd?.props?.pageProps ?? {})
      // 取 pageProps 的前 3000 chars 作為 sample
      nextDataSample = JSON.parse(JSON.stringify(nd?.props?.pageProps).slice(0, 3000))
    } catch {
      nextDataKeys = ['PARSE_ERROR']
    }
  }

  // 檢查 __INITIAL_STATE__
  const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})(?:\s*;|\s*<)/)
  let initialStateKeys: string[] | null = null
  if (initialStateMatch) {
    try {
      const state = JSON.parse(initialStateMatch[1])
      initialStateKeys = Object.keys(state)
    } catch {
      initialStateKeys = ['PARSE_ERROR']
    }
  }

  // 找所有 inline script 裡的 JSON（只取開頭 200 chars）
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]{20,500}?)<\/script>/g)]
    .map((m) => m[1].trim())
    .filter((s) => s.startsWith('{') || s.startsWith('window.') || s.startsWith('var '))
    .slice(0, 5)

  // 找 <script src> 清單（看是否為 SPA 需要 API）
  const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((s) => !s.includes('gtm') && !s.includes('analytics'))
    .slice(0, 10)

  // HTML 前 1000 chars（看 <body> 結構）
  const bodyStart = html.slice(html.indexOf('<body'), html.indexOf('<body') + 1000)

  return {
    hasNextData: !!nextDataMatch,
    nextDataKeys,
    nextDataPagePropsKeys,
    nextDataSample,
    hasInitialState: !!initialStateMatch,
    initialStateKeys,
    inlineScriptSamples: scriptMatches,
    scriptSrcs,
    bodyStart,
    htmlLength: html.length,
  }
})
