// Step 3 驗證：測試 Workers KV 讀寫是否正常
// 部署到 Cloudflare 後訪問 /api/test-kv 確認
export default defineEventHandler(async (event) => {
  const { cloudflare } = event.context;

  if (!cloudflare?.env?.SCRAPE_CACHE) {
    return {
      success: false,
      error:
        "KV binding 不可用（本地開發環境不支援 KV，需部署到 Cloudflare 測試）",
    };
  }

  const kv = cloudflare.env.SCRAPE_CACHE as KVNamespace;
  const testKey = `test:${Date.now()}`;
  const testValue = `hello-${Date.now()}`;

  await kv.put(testKey, testValue, { expirationTtl: 60 });
  const retrieved = await kv.get(testKey);
  await kv.delete(testKey);

  return {
    success: true,
    written: testValue,
    retrieved,
    match: testValue === retrieved,
  };
});
