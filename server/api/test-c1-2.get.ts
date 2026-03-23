// C1-2 驗證：Turnstile 阻擋無效請求
// 預期：無 token → 400；假 token → 403
export default defineEventHandler(async (event) => {
  const baseUrl = getRequestURL(event).origin

  const results: Record<string, unknown> = {}

  // 測試 1：完全沒有 token
  try {
    await $fetch(`${baseUrl}/api/scrape`, {
      method: 'POST',
      body: { url: 'https://myship.7-11.com.tw/general/detail/GMtest' },
    })
    results.no_token = { pass: false, reason: '應該要被擋下來，但沒有' }
  } catch (err: any) {
    const status = err.data?.statusCode ?? err.statusCode ?? err.status
    results.no_token = {
      pass: status === 400,
      status,
      message: err.data?.message ?? err.message,
    }
  }

  // 測試 2：假的 token
  try {
    await $fetch(`${baseUrl}/api/scrape`, {
      method: 'POST',
      body: {
        url: 'https://myship.7-11.com.tw/general/detail/GMtest',
        turnstile_token: 'FAKE_TOKEN_FOR_TESTING',
      },
    })
    results.fake_token = { pass: false, reason: '應該要被擋下來，但沒有' }
  } catch (err: any) {
    const status = err.data?.statusCode ?? err.statusCode ?? err.status
    results.fake_token = {
      pass: status === 403,
      status,
      message: err.data?.message ?? err.message,
    }
  }

  const allPass = Object.values(results).every((r: any) => r.pass)

  return {
    checkpoint: 'C1-2',
    description: 'Turnstile 阻擋無效請求',
    pass: allPass,
    results,
  }
})
