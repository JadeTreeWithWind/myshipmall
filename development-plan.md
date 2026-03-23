# 開發計劃：賣貨便自架商城

> 對應文件：masterplan v3.2 | 建立日期：2026-03-23
> 本計劃共 6 個階段、55 個步驟，每個階段結尾附有驗證清單（Checkpoint）

---

## 階段 0 — 環境建置與基礎設施（Step 1–8）

> **目標**：所有開發環境、雲端服務、部署管線就緒，確保後續開發不會因為基礎設施問題卡關。

### Step 1：初始化 Nuxt 4 專案

- 使用 `nuxi init` 建立 Nuxt 4 專案
- 安裝核心依賴：`@nuxtjs/tailwindcss`、`daisyui`、`@supabase/supabase-js`、`cheerio`、`dompurify`
- 設定 `nuxt.config.ts` 基本配置（SSR 模式、Cloudflare preset）
- 建立資料夾結構：`/pages`、`/components`、`/composables`、`/server/api`、`/server/utils`

### Step 2：設定 Cloudflare Pages 部署管線

- 將專案推送至 GitHub repository
- 在 Cloudflare Dashboard 建立 Pages 專案，連結 GitHub repo
- 設定 build command（`nuxt build`）與 output directory
- 設定 compatibility flags（如 `nodejs_compat`）
- 執行第一次部署，確認空白 Nuxt 專案可正常上線

### Step 3：建立 Cloudflare Workers KV Namespace

- 在 Cloudflare Dashboard 建立兩個 KV namespace：
  - `SCRAPE_CACHE`：用於 scrape 結果暫存
  - `RATE_LIMIT`：用於 IP Rate Limit 計數
- 在 `wrangler.toml`（或 `nuxt.config.ts` 的 nitro 設定）中設定 KV binding
- 撰寫一個簡單的測試 server route，驗證 KV 讀寫正常

### Step 4：建立 Supabase 專案與資料庫 Schema

- 在 Supabase Dashboard 建立新專案
- 啟用 `pg_trgm` extension
- 執行 masterplan v3.2 第 5.3 節的完整 SQL：建立所有資料表、索引、Trigger
- 記錄 `SUPABASE_URL` 與 `SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_KEY`

### Step 5：撰寫 DB Function — `upsert_shop_with_products`

- 實作原子性匯入函式，包含以下邏輯：
  - upsert `shops`（依 `external_id`）
  - 記錄該賣場原有的 product `external_id` 清單
  - upsert `products`（依 `external_id`，同時計算 `min_price` / `max_price`）
  - upsert `product_specs`（依 `external_id`）
  - 刪除並重寫 `product_images`
  - 將不在新資料中的商品 `status` 設為 `0`（軟刪除）
- 整個函式在同一個 transaction 內完成

### Step 6：設定環境變數與安全性

- 在 Cloudflare Pages 的 environment variables 中設定：
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`（前端用，有 RLS 保護）
  - `SUPABASE_SERVICE_KEY`（僅 server-side）
  - `TURNSTILE_SECRET_KEY`（僅 server-side）
  - `TURNSTILE_SITE_KEY`（前端用）
- 確認 `SUPABASE_SERVICE_KEY` 絕不暴露在前端 bundle 中

### Step 7：設定 Supabase RLS 政策

- `shops`：開放匿名 SELECT
- `products`：開放匿名 SELECT（`WHERE status = 1`）
- `product_specs`：開放匿名 SELECT
- `product_images`：開放匿名 SELECT
- `purchase_clicks`：禁止匿名存取（所有寫入透過 service key）
- `reviews`：開放匿名 SELECT；INSERT 僅限已登入用戶且 `user_id = auth.uid()`

### Step 8：設定 Cloudflare Workers Cron Trigger

- 在 `wrangler.toml` 或 Nuxt nitro 設定中加入 Cron Trigger
- 撰寫 cron handler：定期呼叫 Supabase 任意輕量 API（例如 `SELECT 1`）
- 確認 cron 排程正確觸發（可先設為每分鐘測試，確認後改為每 3 天）

---

### ✅ Checkpoint 0：環境建置驗證

| #    | 驗證項目                                 | 通過條件                                          |
| ---- | ---------------------------------------- | ------------------------------------------------- |
| C0-1 | Nuxt 專案可在本地 `npm run dev` 正常啟動 | 瀏覽器打開 localhost 看到預設頁面                 |
| C0-2 | Cloudflare Pages 部署成功                | 訪問 `*.pages.dev` 網址看到頁面                   |
| C0-3 | Workers KV 讀寫正常                      | 測試 route 可成功寫入與讀取 KV                    |
| C0-4 | Supabase 資料庫 schema 完整              | 6 張資料表、所有索引、Trigger 皆存在              |
| C0-5 | DB Function 可正常執行                   | 手動呼叫 `upsert_shop_with_products` 寫入測試資料 |
| C0-6 | 環境變數設定正確                         | Server route 可成功連線 Supabase                  |
| C0-7 | RLS 政策生效                             | 匿名可 SELECT shops/products；匿名無法 INSERT     |
| C0-8 | Cron Trigger 成功觸發                    | Cloudflare 日誌中看到 cron 執行記錄               |

---

## 階段 1 — 匯入功能（Step 9–18）

> **目標**：完成賣貨便資料匯入的完整流程（scrape → 預覽 → 確認寫入），這是所有其他功能的資料基礎。

### Step 9：實作 Turnstile 驗證工具函式

- 撰寫 `server/utils/verifyTurnstile.ts`
- 接收 `turnstile_token`，向 Cloudflare siteverify API 驗證
- 驗證失敗時拋出 403 錯誤
- 在 Cloudflare Dashboard 建立 Turnstile widget（Invisible mode），取得 site key 與 secret key

### Step 10：實作 KV Rate Limit 工具函式

- 撰寫 `server/utils/checkRateLimit.ts`
- 實作 key 格式：`rate_limit:{ip}:{endpoint}:{hour_window}`
- 支援可配置的限制次數（scrape: 10、confirm-import: 5）
- 超過限制時回傳 429 狀態碼

### Step 11：實作 Scrape 解析器

- 撰寫 `server/utils/scrapeMyship.ts`
- 使用 cheerio 解析賣貨便頁面 HTML
- 輸出結構化的 `ShopData`（賣場資訊 + 商品列表 + 規格 + 圖片）
- 驗證網址格式是否符合 `https://myship.7-11.com.tw/general/detail/GM...`

### Step 12：實測 Workers CPU 時間

- 部署 Step 11 的 scrape 解析器到 Cloudflare Workers
- 使用不同大小的賣貨便頁面進行測試（小型賣場 5 件商品、大型賣場 50+ 件商品）
- 記錄每次請求的 CPU 時間（Workers 免費方案限制 10ms CPU time）
- 若超限：評估是否需改用 Workers Unbound，或優化 cheerio 解析邏輯

### Step 13：實作 `POST /api/scrape`

- 整合 Step 9（Turnstile）+ Step 10（Rate Limit）+ Step 11（Scrape）
- 完成流程：驗證 Turnstile → 檢查 Rate Limit → 驗證網址 → 抓取解析 → 存入 KV（TTL 10 分鐘）→ 回傳預覽
- KV key 格式：`scrape:{hash(url)}`

### Step 14：實作 `POST /api/confirm-import`

- 完成流程：驗證 Turnstile → 檢查 Rate Limit → 從 KV 讀取快取 → 呼叫 DB Function → 刪除 KV 快取
- KV 快取不存在或已過期時回傳 410 錯誤
- 確認軟刪除機制：不在新資料中的商品 `status` 改為 `0`

### Step 15：建立匯入頁面 — 網址輸入與 Turnstile 元件

- 建立 `/pages/import.vue`
- 實作網址輸入框（含格式驗證提示）
- 整合 Turnstile invisible widget（前端取得 token）
- 「讀取賣場資料」按鈕觸發 `/api/scrape`

### Step 16：建立匯入頁面 — 預覽與確認匯入

- 收到 scrape 回傳的 ShopData 後，渲染預覽畫面
  - 顯示賣場名稱、圖片、商品數量
  - 商品列表：名稱、主圖、規格數、價格範圍
- 「確認匯入」按鈕觸發 `/api/confirm-import`
- 匯入成功後顯示結果（賣場名稱 + 商品數量）並提供「前往商城頁」連結
- 處理各種錯誤狀態：Turnstile 失敗、Rate Limit 超限、KV 過期

### Step 17：測試重複匯入與軟刪除

- 匯入同一賣場兩次，驗證 upsert 行為正確（資料更新而非重複）
- 模擬商品消失情境：第二次匯入時減少商品，確認消失的商品 `status` 變為 `0`
- 驗證規格 upsert 正常運作（依 `external_id` 更新而非先刪後寫）
- 驗證圖片先刪後寫正常運作

### Step 18：測試防濫用機制

- 測試 Turnstile 驗證：使用無效 token 呼叫 API，確認回傳 403
- 測試 Rate Limit：連續呼叫超過限制次數，確認回傳 429
- 測試 KV 快取過期：等待 10 分鐘後呼叫 confirm-import，確認回傳 410
- 測試無效網址格式：輸入非賣貨便網址，確認回傳錯誤

---

### ✅ Checkpoint 1：匯入功能驗證

| #    | 驗證項目                       | 通過條件                                                          |
| ---- | ------------------------------ | ----------------------------------------------------------------- |
| C1-1 | 完整匯入流程端到端成功         | 輸入真實賣貨便網址 → 預覽正確 → 確認匯入 → DB 中有正確資料        |
| C1-2 | Turnstile 阻擋無效請求         | 無 token 或假 token 回傳 403                                      |
| C1-3 | Rate Limit 正確攔截            | 超過 10 次 scrape 或 5 次 confirm 後回傳 429                      |
| C1-4 | KV 快取過期處理正確            | 超過 10 分鐘後 confirm-import 回傳 410                            |
| C1-5 | 重複匯入為 upsert              | 同一賣場匯入兩次，DB 中不會有重複資料                             |
| C1-6 | 軟刪除機制正常運作             | 商品消失後 `status = 0`，再次匯入包含該商品時 `status` 恢復為 `1` |
| C1-7 | Workers CPU 時間在限制內       | 大型賣場的 scrape 不超過 CPU 限制（或已切換至 Unbound）           |
| C1-8 | DB Function transaction 完整性 | 部分資料錯誤時整筆 rollback，不會出現部分寫入                     |

---

## 階段 2 — 核心展示頁面（Step 19–32）

> **目標**：完成所有面向買家的瀏覽頁面（首頁、搜尋、商城頁、商品頁），以及購買點擊記錄功能。

### Step 19：建立共用 Layout 與導覽列

- 建立 `layouts/default.vue`
- 導覽列：Logo / 品牌名稱（暫定）、搜尋框、主題切換按鈕
- 底部 Footer：關於連結、版權聲明
- 響應式設計：Mobile First，導覽列在手機上收合為漢堡選單

### Step 20：建立商品卡片元件

- 建立 `components/ProductCard.vue`
- 顯示：商品主圖、名稱、價格範圍（min_price ~ max_price）、商城名稱、click_count
- 點擊導向 `/product/[id]`
- 圖片使用 lazy load（`loading="lazy"`）
- 設計 Mobile First，卡片在手機上為單欄，桌面為多欄網格

### Step 21：建立 Supabase Client Composable

- 撰寫 `composables/useSupabase.ts`
- 初始化 Supabase client（使用 `SUPABASE_ANON_KEY`，有 RLS 保護）
- 提供常用查詢方法的封裝（搜尋商品、取得商城資料等）

### Step 22：建立搜尋查詢 Composable

- 撰寫 `composables/useProductSearch.ts`
- 實作 masterplan 6.5 節的搜尋查詢（Trigram ILIKE 為主力）
- 支援參數：keyword、sort_by、min_price、max_price、offset
- 價格篩選使用「區間重疊」邏輯
- 回傳分頁資訊（是否有下一頁）

### Step 23：建立首頁

- 建立 `/pages/index.vue`
- 搜尋框置頂，視覺突出
- 熱門商品列表：依 `click_count` 降序取前 20 筆
- 使用 `ProductCard` 元件渲染
- 搜尋框提交後導向 `/search?q=keyword`

### Step 24：建立搜尋結果頁

- 建立 `/pages/search.vue`
- 頂部搜尋框（保留 keyword）
- 排序切換：熱門（預設）/ 價格低→高 / 價格高→低 / 最新
- 價格區間篩選（輸入最低 / 最高價格）
- 商品列表使用 `ProductCard` 元件
- 無結果時顯示友善提示

### Step 25：實作分頁或無限捲動（搜尋結果頁）

- 初期實作「載入更多」按鈕（比無限捲動簡單，MVP 足夠）
- 每次載入 20 筆，點擊後 append 下一批
- 顯示目前已載入筆數

### Step 26：搜尋品質實測（Trigram vs FTS）

- 匯入至少 3 個不同賣場的真實資料
- 準備 10 組中文測試搜尋詞（商品名稱片段、商城名稱、常見錯字）
- 分別測試 Trigram ILIKE 與 FTS `@@` 的搜尋結果
- 記錄比較結果，確認搜尋策略是否需要調整
- 如果 FTS 在某些場景優於 Trigram，考慮調整查詢優先順序

### Step 27：建立商城頁

- 建立 `/pages/shop/[id].vue`
- 頂部顯示商城資訊：名稱、圖片、描述（HTML，需 DOMPurify 過濾）
- 商品列表：該商城的所有上架商品（`status = 1`）
- 排序選項同搜尋結果頁
- 顯示「資料最後更新時間」（`shops.updated_at`）

### Step 28：建立商品詳細頁 — 基本資訊

- 建立 `/pages/product/[id].vue`
- 顯示：商品名稱、主圖、描述（HTML，需 DOMPurify 過濾）
- 規格列表：名稱、價格 / 特價、庫存
- 圖片輪播（使用 `product_images`）
- 所屬商城連結（導向 `/shop/[id]`）
- 顯示「資料最後更新時間」

### Step 29：實作 XSS 防護

- 安裝 DOMPurify
- 撰寫 `composables/useSanitize.ts` 或 directive
- 所有 `v-html` 渲染的內容（商品描述、商城描述）皆通過 DOMPurify 過濾
- 測試：嘗試注入 `<script>alert('xss')</script>`，確認被過濾

### Step 30：實作 `POST /api/record-click`

- 完成流程：
  1. 確認 `product_id` 存在
  2. IP 防刷檢查：查詢 `purchase_clicks` 中該 IP + 該商品過去 1 小時的記錄數
  3. 若 >= 3 次：回傳 429（前端仍導向賣貨便，但不計入點擊）
  4. 寫入 `purchase_clicks`（含 IP）
  5. 原子性 `click_count + 1`

### Step 31：建立商品詳細頁 — 購買按鈕

- 「前往購買」按鈕視覺突出（DaisyUI primary 按鈕、醒目大小）
- 按鈕文字明確提示「將前往賣貨便購買」
- 點擊時：
  1. 呼叫 `/api/record-click`（非同步，不阻擋跳轉）
  2. `window.open()` 開啟賣貨便原始商品頁面
- 處理 429 錯誤：靜默處理，不影響使用者跳轉

### Step 32：實作 DaisyUI 主題切換

- 在導覽列加入主題切換按鈕（亮色 / 暗色）
- 使用 DaisyUI 內建的 `data-theme` 機制
- 將使用者偏好儲存在 localStorage
- 首次載入時偵測系統偏好（`prefers-color-scheme`）

---

### ✅ Checkpoint 2：核心展示頁面驗證

| #     | 驗證項目                     | 通過條件                                                  |
| ----- | ---------------------------- | --------------------------------------------------------- |
| C2-1  | 首頁正常載入                 | 搜尋框可見、熱門商品列表顯示正確                          |
| C2-2  | 搜尋功能完整                 | 輸入中文關鍵字 → 結果正確；排序切換正常；價格篩選邏輯正確 |
| C2-3  | 價格篩選「區間重疊」邏輯正確 | 商品 100~500 元，篩選 200~400 → 該商品仍出現              |
| C2-4  | 搜尋品質可接受               | 10 組測試詞中至少 8 組回傳合理結果                        |
| C2-5  | 商城頁資料正確               | 商城資訊完整、商品列表只顯示 `status = 1`                 |
| C2-6  | 商品詳細頁資訊完整           | 名稱、圖片、規格、描述皆正確顯示                          |
| C2-7  | XSS 防護生效                 | `<script>` 標籤被 DOMPurify 過濾                          |
| C2-8  | 購買按鈕正確運作             | 點擊 → 記錄成功 → 新分頁開啟賣貨便頁面                    |
| C2-9  | record-click IP 防刷正常     | 同 IP 同商品第 4 次點擊回傳 429，但仍可跳轉               |
| C2-10 | 分頁載入正常                 | 「載入更多」可持續取得下一批商品                          |
| C2-11 | 手機瀏覽體驗良好             | 在手機尺寸下排版合理、按鈕可點擊、無橫向溢出              |
| C2-12 | 主題切換正常                 | 亮暗模式切換後全站色調正確、重新整理後記住偏好            |

---

## 階段 3 — SEO 基礎與部署優化（Step 33–38）

> **目標**：確保商品頁能被搜尋引擎正確索引，建立 SEO 基礎。

### Step 33：設定每頁 Meta Tags

- 使用 Nuxt 的 `useHead()` 或 `useSeoMeta()` 為每個頁面設定：
  - `title`：包含商品名稱或搜尋關鍵字
  - `description`：商品描述前 150 字（去除 HTML 標籤）
  - `og:title`、`og:description`、`og:image`（商品主圖）
  - `og:url`：頁面完整網址
- 首頁與搜尋頁使用通用的品牌 meta

### Step 34：設定 Open Graph 與 Twitter Card

- 商品詳細頁：`og:image` 使用商品主圖、`og:type = product`
- 商城頁：`og:image` 使用商城圖片
- 設定 `twitter:card = summary_large_image`
- 測試：使用 Facebook Sharing Debugger 和 Twitter Card Validator 驗證

### Step 35：建立基本 Sitemap

- 使用 `@nuxtjs/sitemap` 或手動撰寫 `/server/routes/sitemap.xml.ts`
- 包含所有商品頁面（`/product/[id]`）和商城頁面（`/shop/[id]`）
- 設定 `lastmod` 為 `updated_at`
- 首頁和關於頁設定 `priority: 1.0` / `0.5`

### Step 36：設定 robots.txt

- 允許所有搜尋引擎爬取
- 指向 sitemap.xml 位置
- 排除不需要索引的路徑（如 `/import`）

### Step 37：驗證 SSR 輸出

- 使用 `curl` 或 `view-source:` 檢查商品頁的 HTML 原始碼
- 確認 meta tags、商品名稱、描述、圖片 URL 都在初始 HTML 中（非 JavaScript 渲染後才出現）
- 確認搜尋引擎可以直接從 HTML 取得所有必要資訊

### Step 38：提交 Google Search Console

- 驗證網站所有權
- 提交 sitemap.xml
- 使用「網址檢查」工具測試商品頁是否可正確索引
- 確認無 crawl error

---

### ✅ Checkpoint 3：SEO 基礎驗證

| #    | 驗證項目                     | 通過條件                                                    |
| ---- | ---------------------------- | ----------------------------------------------------------- |
| C3-1 | 商品頁 meta tags 完整        | `<title>`、`<meta description>`、OG tags 皆在 HTML 原始碼中 |
| C3-2 | Open Graph 預覽正確          | Facebook Debugger 可顯示商品圖片、標題、描述                |
| C3-3 | Sitemap 包含所有頁面         | 訪問 `/sitemap.xml` 可看到所有商品與商城頁面                |
| C3-4 | robots.txt 設定正確          | 訪問 `/robots.txt` 顯示正確內容                             |
| C3-5 | SSR HTML 包含完整內容        | `curl` 商品頁 → HTML 中有商品名稱與描述（非空白）           |
| C3-6 | Google Search Console 無錯誤 | 網址檢查工具顯示「網頁可供索引」                            |

---

## 階段 4 — 評論系統（Step 39–46）

> **目標**：完成 Google OAuth 登入與商品評論功能。

### Step 39：設定 Supabase Auth — Google OAuth

- 在 Google Cloud Console 建立 OAuth 2.0 Client
- 設定授權回呼 URI（Supabase callback URL）
- 在 Supabase Dashboard 啟用 Google provider，填入 client ID 與 secret
- 測試：呼叫 `supabase.auth.signInWithOAuth({ provider: 'google' })` 可完成登入

### Step 40：建立登入 / 登出 UI 元件

- 在導覽列右側顯示登入狀態
- 未登入：顯示「登入」按鈕（觸發 Google OAuth）
- 已登入：顯示使用者名稱 / 頭像、「登出」按鈕
- 建立 `composables/useAuth.ts` 管理登入狀態

### Step 41：建立評論列表元件

- 建立 `components/ReviewList.vue`
- 接收 `product_id`，查詢該商品的所有評論
- 顯示：使用者名稱、評分（星星圖示）、留言內容、時間
- 頂部顯示平均評分與評論總數
- 依 `created_at` 降序排列

### Step 42：建立評論表單元件

- 建立 `components/ReviewForm.vue`
- 未登入時：顯示「登入後即可評論」提示
- 已登入時：
  - 星評選擇器（1~5 顆星，點擊選擇）
  - 文字輸入框
  - 送出按鈕
- 如果該使用者已評論過此商品：顯示已評論內容，並提供「編輯」功能

### Step 43：實作評論寫入 API

- 撰寫 `server/api/reviews.post.ts`
- 從 request header 中取得使用者 JWT，驗證身份
- 驗證 `product_id` 存在、`rating` 在 1~5 之間、`content` 非空
- 使用 service key 寫入 `reviews` 表
- 處理 `unique(product_id, user_id)` 衝突：回傳「您已評論過此商品」

### Step 44：商品詳細頁整合評論

- 在商品詳細頁（`/product/[id]`）下方加入 `ReviewList` 和 `ReviewForm`
- 商品資訊區顯示平均評分星星與評論數量
- 評論送出後即時更新列表（不需重新整理頁面）

### Step 45：測試評論防濫用

- 測試未登入無法評論（API 回傳 401）
- 測試同一使用者對同一商品重複評論（API 回傳衝突錯誤）
- 測試 rating 超出範圍（API 回傳 400）
- 測試空白內容（API 回傳 400）

### Step 46：測試評論 RLS

- 使用 anon key 嘗試直接 INSERT reviews → 應被 RLS 阻擋
- 使用已登入使用者的 JWT 嘗試為其他 user_id 評論 → 應被 RLS 阻擋
- 確認匿名可 SELECT 所有評論

---

### ✅ Checkpoint 4：評論系統驗證

| #    | 驗證項目                | 通過條件                                        |
| ---- | ----------------------- | ----------------------------------------------- |
| C4-1 | Google OAuth 登入成功   | 點擊登入 → Google 授權頁面 → 回到網站已登入     |
| C4-2 | 登入 / 登出 UI 狀態正確 | 登入後顯示名稱；登出後恢復「登入」按鈕          |
| C4-3 | 評論送出成功            | 選擇星數 + 輸入留言 → 送出 → 列表即時顯示新評論 |
| C4-4 | 平均評分計算正確        | 3 則評論分別 3、4、5 星 → 平均顯示 4.0          |
| C4-5 | 重複評論被阻擋          | 同一使用者再次評論 → 提示「您已評論過」         |
| C4-6 | 未登入使用者無法評論    | 評論表單顯示「請先登入」；API 回傳 401          |
| C4-7 | RLS 安全性通過          | 匿名無法直接 INSERT；使用者無法代替他人評論     |

---

## 階段 5 — 體驗優化與上線準備（Step 47–55）

> **目標**：完成關於頁、全站視覺統一、效能優化，準備正式上線。

### Step 47：建立關於頁

- 建立 `/pages/about.vue`
- 內容：網站理念（為何建立此站）、核心功能介紹、常見問題 Q&A
- Q&A 至少涵蓋：
  - 本站與賣貨便的關係？（非官方、僅做展示）
  - 購買流程是什麼？（導向賣貨便完成）
  - 如何匯入自己的商城？
  - 商品資料多久更新一次？

### Step 48：全站視覺風格統一

- 確定品牌名稱與 Logo（至少 placeholder）
- 統一 DaisyUI 主題色設定（primary、secondary、accent）
- 統一字體、間距、圓角等視覺元素
- 確保亮色 / 暗色主題下所有元件的色彩對比度符合 WCAG AA 標準

### Step 49：效能優化 — 圖片

- 所有商品圖片加入 `loading="lazy"`
- 設定圖片的 `width` 和 `height` 屬性，避免 Cumulative Layout Shift (CLS)
- 使用 Nuxt Image 或手動設定 `srcset` 提供不同尺寸
- 圖片無法載入時顯示 fallback placeholder

### Step 50：效能優化 — 資料載入

- 首頁熱門商品：考慮 ISR（Incremental Static Regeneration）或短時間快取
- 商品詳細頁：SSR 確保 SEO，但搜尋與篩選可在 client-side 處理
- API 回應加入適當的 Cache-Control header
- 使用 Nuxt 的 `useAsyncData` 搭配 `key` 避免重複請求

### Step 51：錯誤處理與空狀態

- 建立全域錯誤頁面（`error.vue`）：404、500
- 搜尋無結果：友善提示 + 建議嘗試其他關鍵字
- 商品頁 404（商品不存在或已下架）：提示「此商品目前無法顯示」
- API 錯誤時的 Toast 通知元件
- 載入中狀態的 Skeleton loading 元件

### Step 52：全站響應式測試

- 在以下裝置尺寸測試所有頁面：
  - 手機（375px、390px）
  - 平板（768px）
  - 桌面（1024px、1440px）
- 確認所有頁面：
  - 無橫向滾動
  - 按鈕可正常點擊（不會太小）
  - 文字不會溢出容器
  - 圖片比例正確

### Step 53：全站跨瀏覽器測試

- 測試瀏覽器：Chrome、Safari（iOS）、Firefox
- 確認功能正常：搜尋、匯入、購買點擊、評論、主題切換
- 確認 DaisyUI 元件在各瀏覽器的渲染一致性

### Step 54：正式環境部署與監控

- 設定自訂網域（如有）
- 確認所有環境變數在 production 環境中正確設定
- 確認 Cloudflare SSL/TLS 設定為 Full (Strict)
- 確認 Cron Trigger 在 production 環境正常運作
- 設定 Cloudflare Analytics 或 Web Analytics 追蹤流量

### Step 55：上線前最終驗收

- 執行完整的端到端流程測試（從匯入 → 搜尋 → 瀏覽 → 購買點擊 → 評論）
- 邀請 2~3 位真實使用者進行試用，收集回饋
- 確認所有安全性設定（RLS、Service Key、XSS 防護）
- 確認免費方案用量在安全範圍內
- 記錄已知限制與待改進事項，規劃 Phase 4 優先順序

---

### ✅ Checkpoint 5：上線前最終驗證

| #     | 驗證項目            | 通過條件                                          |
| ----- | ------------------- | ------------------------------------------------- |
| C5-1  | 關於頁內容完整      | Q&A 回答清楚，使用者能理解本站定位                |
| C5-2  | 全站視覺一致        | 亮暗主題下所有頁面風格統一、無突兀元素            |
| C5-3  | 圖片載入效能良好    | Lighthouse Performance 分數 ≥ 80                  |
| C5-4  | 錯誤處理完善        | 404 頁面友善、API 錯誤有 Toast 提示、空狀態有引導 |
| C5-5  | 手機瀏覽體驗流暢    | 所有頁面在 375px 寬度下可正常操作                 |
| C5-6  | 跨瀏覽器相容        | Chrome、Safari、Firefox 核心功能皆正常            |
| C5-7  | 端到端流程完整      | 匯入 → 搜尋 → 商品頁 → 購買點擊 → 評論 全程無錯誤 |
| C5-8  | 安全性設定無漏洞    | Service Key 未暴露；RLS 生效；XSS 被過濾          |
| C5-9  | Production 環境穩定 | 自訂網域可訪問、SSL 正常、Cron Trigger 運作中     |
| C5-10 | 真實使用者回饋正面  | 試用者能順利完成核心流程、無重大 UX 問題          |

---

## 附錄：步驟與 Masterplan 對照表

| 開發階段          | 步驟範圍   | 對應 Masterplan 章節                                         |
| ----------------- | ---------- | ------------------------------------------------------------ |
| 階段 0 — 環境建置 | Step 1–8   | 四、技術架構 / 五、資料模型 / 九、免費方案                   |
| 階段 1 — 匯入功能 | Step 9–18  | 3.5 匯入功能 / 六、API 設計 / 七、Turnstile / 八、Rate Limit |
| 階段 2 — 核心展示 | Step 19–32 | 3.1–3.3 / 六、API 設計 / 十、UI 設計 / 十一、安全性          |
| 階段 3 — SEO 基礎 | Step 33–38 | 十二、Phase 1 SEO 項目                                       |
| 階段 4 — 評論系統 | Step 39–46 | 3.4 評論系統 / 十一、安全性                                  |
| 階段 5 — 優化上線 | Step 47–55 | 十、UI 設計 / 十三、潛在挑戰                                 |
