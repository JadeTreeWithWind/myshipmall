// ⚠️ TEMP DEBUG — 驗證後刪除
export default defineEventHandler(async (event) => {
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
  // 找 <script src> 清單（看是否為 SPA 需要 API）
  const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((s) => !s.includes('gtm') && !s.includes('analytics'))
    .slice(0, 10)

  // 找商品相關 HTML 片段（搜尋關鍵字附近 500 chars）
  const keywords = ['cgdd', 'product-item', 'goods-item', 'prod_', 'item-card', 'shop-goods', 'cgddname', 'CgddName', '商品名稱']
  const snippets: Record<string, string> = {}
  for (const kw of keywords) {
    const idx = html.toLowerCase().indexOf(kw.toLowerCase())
    if (idx !== -1) {
      snippets[kw] = html.slice(Math.max(0, idx - 100), idx + 400)
    }
  }

  // 找所有 data-* attribute（找看看有沒有 data-id、data-cgdd 之類）
  const dataAttrs = [...new Set([...html.matchAll(/data-[\w-]+="[^"]*"/g)].map(m => m[0].split('=')[0]))]

  // 找賣場名稱相關
  const shopNameSnippet = (() => {
    for (const pat of ['shop-name', 'shopname', 'ShopName', 'store-name', '賣場名稱']) {
      const idx = html.toLowerCase().indexOf(pat.toLowerCase())
      if (idx !== -1) return html.slice(Math.max(0, idx - 50), idx + 300)
    }
    return null
  })()

  // <ul> / <li> 數量統計（找商品列表用的標籤結構）
  const ulCount = (html.match(/<ul/g) || []).length
  const liCount = (html.match(/<li/g) || []).length
  const divCount = (html.match(/<div/g) || []).length

  return {
    hasNextData: !!nextDataMatch,
    hasInitialState: !!initialStateMatch,
    scriptSrcs,
    htmlLength: html.length,
    ulCount, liCount, divCount,
    dataAttrs,
    shopNameSnippet,
    snippets,
  }
})
