# Masterplan：賣貨便自架商城

> 文件版本：v3.2 | 最後更新：2026-03-23
> 變更說明：修正 10 項設計問題（詳見附錄 v3.1 → v3.2）；修正 API 描述殘留錯誤；purchase_clicks 補 IP 欄位；record-click 補 IP 防刷流程；匯入 Rate Limit 改用 Workers KV；搜尋策略調整為 Trigram 優先；修正價格篩選邏輯；新增商品下架處理機制；規格改用 upsert；SEO 提前至 Phase 1；閒置暫停改用 Cloudflare Cron Trigger

---

## 一、專案概述與目標

本專案旨在為賣貨便（7-11 myship）的賣家建立一個功能更完整的商城展示網站。賣貨便官方平台缺乏獨立商品頁面與搜尋功能，導致買家瀏覽體驗不佳。本網站作為「展示層」，不經手任何金流，所有購買行為皆導向賣貨便原始頁面完成交易。

**核心目標：**

- 提供買家良好的商品瀏覽與搜尋體驗
- 為每個商品建立獨立頁面
- 提供商家簡單的賣貨便資料匯入功能
- 記錄購買點擊數，作為熱門排序依據

---

## 二、目標受眾

| 角色 | 描述                                           |
| ---- | ---------------------------------------------- |
| 買家 | 希望搜尋或瀏覽賣貨便商品的一般消費者           |
| 賣家 | 擁有賣貨便賣場、希望建立更完整商城展示頁的賣家 |

---

## 三、核心功能

### 3.1 頁面規劃

| 頁面       | 路由            | 功能說明                                  |
| ---------- | --------------- | ----------------------------------------- |
| 首頁       | `/`             | 搜尋框 + 熱門商品列表                     |
| 搜尋結果頁 | `/search`       | 搜尋框 + 結果列表 + 排序切換              |
| 商城頁     | `/shop/[id]`    | 商城資訊 + 該商城商品列表                 |
| 商品詳細頁 | `/product/[id]` | 商品資訊、規格、圖片、評論列表 + 購買按鈕 |
| 商城匯入頁 | `/import`       | 輸入賣貨便網址 → 預覽 → 確認匯入          |
| 關於頁     | `/about`        | 網站理念、功能介紹、Q&A                   |

### 3.2 搜尋功能

- 搜尋範圍：商品名稱 + 商城名稱（商城名稱權重較低）
- 排序選項：
  - 熱門程度（預設，依 `click_count` 降序）
  - 價格由低到高 / 由高到低
  - 更新時間新到舊 / 舊到新
- 篩選選項：價格區間（依 `min_price` / `max_price` 快取欄位，無需 JOIN）

> **★ [修正6] 價格篩選邏輯修正**
> 篩選條件改為「價格區間有重疊即顯示」，而非原本的「完全包含」邏輯。
> 例如：商品價格區間 100~500，使用者篩選 200~400 → 應該要顯示此商品。
> 修正後條件：`p.max_price >= :min_price AND p.min_price <= :max_price`

### 3.3 熱門度機制

- 買家點擊商品詳細頁的「購買」按鈕，前端呼叫 `/api/record-click`
- 後端先檢查 IP 頻率限制，通過後同時執行兩件事：寫入 `purchase_clicks` 明細（含 IP），並對 `products.click_count` 做原子性 +1
- 熱門排序直接讀取 `click_count`，不需 COUNT 子查詢
- 同一 IP 對同一商品每小時最多記錄 3 次，防止刷熱度

### 3.4 評論系統

- 範圍：針對單一商品
- 需透過 Google OAuth 登入後才能留言
- 評論內容：評分（1–5 顆星）+ 留言文字
- **每位使用者對同一商品只能留一則評論**（`unique(product_id, user_id)` 約束）
- 未登入者可瀏覽評論，但無法評論

### 3.5 商城匯入功能

- 無需登入，任何人皆可使用，不限匯入數量
- 採雙層防濫用機制：Cloudflare Turnstile（擋機器人）+ IP Rate Limit（擋人工濫用）
- 流程：

  ```
  使用者輸入網址 + 通過 Turnstile 驗證
          ↓
  [POST /api/scrape]（IP：每小時最多 10 次）
  驗證 Turnstile Token → 驗證網址格式 → 抓取解析
  → 結果存入 Workers KV（key=hash(url)，TTL=10 分鐘）
  → 回傳預覽資料給前端
          ↓
  前端顯示預覽（賣場資訊 + 商品列表）
          ↓
  使用者按「確認匯入」
          ↓
  [POST /api/confirm-import]（IP：每小時最多 5 次）
  再次驗證 Turnstile → 從 KV 讀取快取資料（不再重新 scrape）
  → 若快取已過期（TTL 10 分鐘）→ 回傳錯誤，請使用者重新預覽
  → DB Function 原子性寫入（upsert 賣場、商品、規格、圖片）
  → 新資料中不存在的商品標記為下架（status = 0）
  → Trigger 自動更新 search_vector、min_price、max_price
  ```

- 重複匯入同一賣場執行 upsert，規格採 upsert（依 `external_id`），圖片採先刪後寫確保同步

> **為何改用 Workers KV 快取，不再重新 scrape？**
> 原設計 confirm-import 會重新 scrape 一次，理由是防止前端傳入假資料、避免資料過時。
> 改用 KV 快取後同樣能解決這兩個問題，且只需抓取一次：
>
> 1. **防竄改**：快取存在 Server 端（KV），前端完全不需要傳回 ShopData
> 2. **資料新鮮度**：TTL 10 分鐘內保證資料不過時；超時自動失效，請使用者重新預覽
> 3. **效能提升**：省去一次外部 HTTP 請求，降低 Workers CPU 使用與回應時間

> **★ [修正7] 商品下架處理機制**
> 重新匯入同一賣場時，若原有商品在新資料中不存在，將其 `status` 改為 `0`（下架），
> 而非直接刪除，以保留歷史評論與點擊數據。
> DB Function 流程：先取得該賣場原有的 product external_id 清單，
> 匯入完成後，將不在新清單中的商品 `status` 設為 `0`。

---

## 四、技術架構

| 層級            | 技術選擇                                | 說明                                                    |
| --------------- | --------------------------------------- | ------------------------------------------------------- |
| 前端框架        | Nuxt 4                                  | SSR/SSG 支援，SEO 友好                                  |
| 後端            | Nuxt Server Routes → Cloudflare Workers | `/server/api/` 自動部署為 Workers                       |
| 資料庫          | Supabase (PostgreSQL)                   | 資料儲存 + Auth + FTS                                   |
| 身份驗證        | Supabase Auth（Google OAuth）           | 僅用於留言功能                                          |
| HTML 解析       | cheerio                                 | 已完成實作                                              |
| 搜尋            | PostgreSQL Trigram（主力）+ FTS（輔助） | 初期 Trigram 對中文更實用；未來可升級至 Algolia         |
| **Scrape 快取** | **Cloudflare Workers KV**               | **scrape 結果暫存，TTL 10 分鐘，取代雙次 scrape**       |
| **Rate Limit**  | **Cloudflare Workers KV**               | **匯入與點擊的 IP Rate Limit，在 Edge 層攔截，不打 DB** |
| 防濫用          | Cloudflare Turnstile + KV Rate Limit    | 雙層保護匯入 API                                        |
| 部署平台        | Cloudflare Pages + Workers              | 全球 CDN，低延遲                                        |
| **閒置保活**    | **Cloudflare Workers Cron Trigger**     | **定時 ping Supabase，防止免費方案閒置暫停**            |

### Cloudflare 部署注意事項

- scrape API 需對外抓取頁面，需在 **Phase 1 早期**提前測試 Workers CPU 執行時間限制
- cheerio 解析大型 HTML 可能較耗 CPU，若超限改用 Cloudflare Workers Unbound
- Workers KV 綁定需在 `wrangler.toml` 設定，並在 Cloudflare Dashboard 建立 KV namespace（需建立兩個：一個用於 scrape 快取，一個用於 rate limit）
- Cron Trigger 在 `wrangler.toml` 中設定 `[triggers] crons = ["0 */5 * * *"]`，每 5 天執行一次 keep-alive

---

## 五、資料模型

### 5.1 設計原則

1. **快取計算結果**：熱門排序（`click_count`）與價格篩選（`min_price`/`max_price`）直接存在 `products`，查詢時不做 JOIN 或子查詢
2. **搜尋策略分層**：初期以 Trigram 模糊搜尋為主力（對中文無需斷詞），保留 FTS `tsvector` 索引作為未來升級基礎
3. **原子性匯入**：用 DB Function 包裝整個匯入流程，避免部分寫入
4. **防濫用**：匯入 API 加入 Cloudflare Turnstile + Workers KV Rate Limit 雙重防護
5. **軟刪除**：商品下架時設 `status = 0`，保留歷史資料

### 5.2 資料表一覽

| 資料表            | 用途                   |
| ----------------- | ---------------------- |
| `shops`           | 賣場資訊               |
| `products`        | 商品資訊（含快取欄位） |
| `product_specs`   | 商品規格               |
| `product_images`  | 商品圖片               |
| `purchase_clicks` | 購買點擊明細（含 IP）  |
| `reviews`         | 商品評論（含評分）     |

> **★ [修正4] 移除 `import_rate_limit` 資料表**
> Rate Limit 改由 Workers KV 在 Edge 層處理，不再需要資料庫表。
> 同時也不再需要 pg_cron 定期清除，簡化架構。

### 5.3 完整資料表結構

```sql
-- ============================================================
-- 完整資料表結構（含索引與全文搜尋）
-- ============================================================

-- 啟用 pg_trgm 支援模糊搜尋（LIKE '%keyword%' 也能走索引）
create extension if not exists pg_trgm;


-- ── 賣場 ────────────────────────────────────────────────────
create table shops (
  id          uuid        primary key default gen_random_uuid(),
  external_id text        unique not null,   -- 賣貨便賣場 ID，例如 GM2412088560889
  name        text        not null,
  shop_url    text,
  image_url   text,
  description text,                          -- 保留 HTML 格式
  imported_at timestamptz,
  updated_at  timestamptz not null default now()
);

-- 賣場名稱搜尋用索引（支援 ILIKE '%keyword%'）
create index idx_shops_name_trgm on shops using gin (name gin_trgm_ops);


-- ── 商品 ────────────────────────────────────────────────────
create table products (
  id            uuid        primary key default gen_random_uuid(),
  shop_id       uuid        not null references shops(id) on delete cascade,
  external_id   text        unique not null,  -- 賣貨便 Cgdd_Id
  name          text        not null,
  description   text,                         -- 保留 HTML 格式
  main_image    text,
  status        int         not null default 1,  -- 1 = 上架中, 0 = 已下架
  min_order     int         not null default 0,
  max_order     int         not null default 0,

  -- ★ 價格快取：從 product_specs 計算後寫入，避免查詢時 JOIN
  min_price     int         not null default 0,
  max_price     int         not null default 0,

  -- ★ 熱門排序快取：每次點擊購買時 +1
  click_count   int         not null default 0,

  -- ★ 全文搜尋向量：匯入時自動更新（未來升級用）
  search_vector tsvector,

  updated_at    timestamptz not null default now()
);

-- 熱門排序索引
create index idx_products_click_count on products (click_count desc);

-- 價格篩選索引
create index idx_products_min_price   on products (min_price);
create index idx_products_max_price   on products (max_price);

-- 更新時間排序索引
create index idx_products_updated_at  on products (updated_at desc);

-- 全文搜尋索引（GIN）— 未來升級用
create index idx_products_search_vector on products using gin (search_vector);

-- ★ 商品名稱模糊搜尋索引（初期搜尋主力）
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);

-- ★ 自動更新 search_vector 的 trigger
-- 結合商品名稱與所屬商城名稱，讓搜尋同時命中商品和商城
create or replace function update_product_search_vector()
returns trigger language plpgsql as $$
declare
  shop_name text;
begin
  select name into shop_name from shops where id = NEW.shop_id;
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(shop_name, '')), 'B');
  return NEW;
end;
$$;

create trigger trg_products_search_vector
before insert or update of name, shop_id on products
for each row execute function update_product_search_vector();


-- ── 規格（品項）────────────────────────────────────────────
create table product_specs (
  id          uuid primary key default gen_random_uuid(),
  external_id text unique,                  -- 賣貨便 Cgds_Id
  product_id  uuid not null references products(id) on delete cascade,
  name        text,
  price       int  not null default 0,
  sale_price  int  not null default 0,      -- 0 = 無特價
  image       text,
  stock       int  not null default 0
);

create index idx_product_specs_product_id on product_specs (product_id);


-- ── 商品圖片 ─────────────────────────────────────────────────
create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  ordering   int  not null default 0
);

create index idx_product_images_product_id on product_images (product_id);


-- ── 購買點擊記錄 ─────────────────────────────────────────────
-- 僅作為明細備查，不用於即時排序計算
-- ★ [修正2] 新增 ip 欄位，支援 IP 防刷機制
create table purchase_clicks (
  id         uuid        primary key default gen_random_uuid(),
  product_id uuid        not null references products(id) on delete cascade,
  ip         text        not null,
  clicked_at timestamptz not null default now()
);

-- ★ [修正2] 複合索引：支援 IP 防刷查詢 + 時間範圍查詢
create index idx_purchase_clicks_product_ip_time
  on purchase_clicks (product_id, ip, clicked_at desc);


-- ── 商品評論 ─────────────────────────────────────────────────
create table reviews (
  id         uuid        primary key default gen_random_uuid(),
  product_id uuid        not null references products(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  rating     smallint    not null check (rating between 1 and 5),
  content    text        not null,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index idx_reviews_product_id on reviews (product_id, created_at desc);
```

### 5.4 關鍵設計決策

**`products` 快取欄位（避免查詢時 JOIN）：**

| 欄位            | 說明                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| `min_price`     | 該商品所有規格的最低售價，匯入時計算寫入                                       |
| `max_price`     | 該商品所有規格的最高售價，匯入時計算寫入                                       |
| `click_count`   | 累計購買點擊次數，每次點擊 +1                                                  |
| `search_vector` | `tsvector` 欄位，含商品名稱（A 權重）+ 商城名稱（B 權重），由 Trigger 自動維護 |
| `updated_at`    | 最後匯入／更新時間，用於「最新」排序                                           |

**★ [修正5] 搜尋索引策略（Trigram 優先）：**

| 索引類型    | 欄位                                     | 用途                                     |
| ----------- | ---------------------------------------- | ---------------------------------------- |
| GIN Trigram | `products.name`、`shops.name`            | **搜尋主力**：中文無需斷詞，直接模糊比對 |
| GIN         | `search_vector`                          | 保留備用，未來升級搜尋引擎時使用         |
| B-tree      | `click_count`、`min_price`、`updated_at` | 排序與篩選                               |

> **★ [修正5] 為何初期以 Trigram 為搜尋主力？**
> PostgreSQL `simple` 字典對中文進行逐字拆分，無法正確斷詞（如「手機殼」被拆為「手」「機」「殼」），
> 導致搜尋結果不精準。Trigram 的 ILIKE 模糊比對反而更符合中文使用者的搜尋習慣。
> 建議在 Phase 1 實際測試兩種方式的搜尋品質，確認後再決定是否調整策略。

---

## 六、API 設計

### 6.1 API 一覽

| API                        | 說明                             | 防護                                          |
| -------------------------- | -------------------------------- | --------------------------------------------- |
| `POST /api/scrape`         | 抓取賣場資料，存入 KV，不寫入 DB | Turnstile + KV Rate Limit（**每小時 10 次**） |
| `POST /api/confirm-import` | 從 KV 讀取快取後原子性寫入 DB    | Turnstile + KV Rate Limit（每小時 5 次）      |
| `POST /api/record-click`   | 記錄購買點擊，`click_count` +1   | IP Rate Limit（同商品每小時 3 次）            |

> **★ [修正1] 修正 `confirm-import` 說明**：原本寫「Server 重新 scrape 後原子性寫入 DB」，
> 但 v3.1 已改為從 KV 讀取快取，此處描述已更正。

### 6.2 `POST /api/scrape`

```
Request Body:
{
  "url": "https://myship.7-11.com.tw/general/detail/GM...",
  "turnstile_token": "CLOUDFLARE_TURNSTILE_TOKEN"
}

流程：
1. 驗證 Turnstile Token（向 Cloudflare 驗證 API 確認）
2. KV Rate Limit 檢查（每 IP 每小時最多 10 次）
   → 從 Workers KV 讀取 rate_limit:{ip}:{endpoint}:{hour_window}
   → 超過限制則回傳 429
3. 驗證網址格式
4. 抓取並解析賣貨便頁面
5. 將 ShopData 存入 Workers KV
   key = scrape:{hash(url)}，TTL = 600 秒（10 分鐘）
6. 回傳 ShopData 給前端顯示預覽（不寫入 DB）

Response: ShopData（賣場資訊 + 商品列表預覽）
```

### 6.3 `POST /api/confirm-import`

```
Request Body:
{
  "url": "...",
  "turnstile_token": "..."
}

流程：
1. 再次驗證 Turnstile Token
2. KV Rate Limit 檢查（每 IP 每小時最多 5 次）
3. 從 Workers KV 讀取快取（key = scrape:{hash(url)}）
   → 若快取不存在或已過期：回傳 410 錯誤，前端提示「預覽已過期，請重新讀取」
   → 若快取存在：直接使用，不重新 scrape
4. 呼叫 DB Function upsert_shop_with_products(shopData)：
   a. upsert shops
   b. 記錄該賣場原有的 product external_id 清單
   c. upsert products（同時計算並寫入 min_price / max_price）
   d. upsert product_specs（依 external_id 定位，無則新增）
   e. 刪除並重寫 product_images
   f. 將不在新資料中的商品 status 設為 0（下架）
   g. search_vector 由 trigger 自動更新
   → 整個流程在同一個 DB transaction 內完成
5. 寫入成功後，主動刪除 KV 快取

Response:
{
  "success": true,
  "shop_name": "...",
  "product_count": 11
}
```

### 6.4 `POST /api/record-click`

```
Request Body:
{
  "product_id": "uuid"
}

流程：
1. 確認 product_id 存在
2. ★ [修正3] IP 防刷檢查：
   查詢 purchase_clicks 中該 IP + 該商品在過去 1 小時內的記錄數
   → 若 >= 3 次：回傳 429（仍導向賣貨便，但不計入點擊數）
3. 寫入一筆 purchase_clicks 記錄（含 IP）
4. 原子性對 products.click_count + 1
   （UPDATE products SET click_count = click_count + 1 WHERE id = :product_id）

Response:
{
  "success": true
}
```

### 6.5 搜尋查詢（供前端 Supabase client 使用）

```sql
-- ★ [修正5] 搜尋主力改為 Trigram ILIKE，FTS 作為備援
-- ★ [修正6] 價格篩選改為「區間重疊」邏輯
select
  p.id,
  p.name,
  p.main_image,
  p.min_price,
  p.max_price,
  p.click_count,
  p.updated_at,
  s.name as shop_name,
  s.id   as shop_id
from products p
join shops s on s.id = p.shop_id
where
  p.status = 1
  and (
    :keyword is null
    or p.name ilike '%' || :keyword || '%'                -- Trigram 模糊搜尋（主力）
    or s.name ilike '%' || :keyword || '%'                -- 商城名稱模糊搜尋
    or p.search_vector @@ to_tsquery('simple', :keyword)  -- FTS（備援）
  )
  -- ★ [修正6] 價格區間重疊篩選：只要商品價格範圍與篩選範圍有交集即顯示
  and (:min_price is null or p.max_price >= :min_price)
  and (:max_price is null or p.min_price <= :max_price)
order by
  case when :sort_by = 'price_asc'  then p.min_price  end asc,
  case when :sort_by = 'price_desc' then p.max_price  end desc,
  case when :sort_by = 'newest'     then p.updated_at end desc,
  p.click_count desc  -- 預設熱門排序
limit 20 offset :offset;
```

---

## 七、Cloudflare Turnstile 整合

1. 在 Cloudflare Dashboard 建立一個 Turnstile widget（建議使用 **Invisible mode**，使用者完全無感知）
2. 前端在「讀取賣場資料」按鈕觸發前，取得 `turnstile_token`
3. 後端 server route 向 `https://challenges.cloudflare.com/turnstile/v0/siteverify` 驗證 token
4. 驗證失敗時回傳 403，前端顯示「請完成人機驗證」

---

## 八、Workers KV Rate Limit 機制

> **★ [修正4] 匯入 Rate Limit 從資料庫改為 Workers KV**
> 原設計使用 `import_rate_limit` 資料表，每次請求都需讀寫 DB。
> 改用 Workers KV 後，Rate Limit 在 Edge 層直接處理，優勢如下：
>
> 1. **降低延遲**：不需 round-trip 到 Supabase，在 Cloudflare Edge 即可判斷
> 2. **減少 DB 負擔**：濫用請求不會打到資料庫
> 3. **自動過期**：KV 的 TTL 自動清除過期記錄，不需要 pg_cron
> 4. **簡化架構**：移除 `import_rate_limit` 資料表與相關 cron job

**KV Rate Limit 實作方式：**

```
Key 格式：rate_limit:{ip}:{endpoint}:{hour_window}
  例如：rate_limit:1.2.3.4:scrape:2026032315
Value：請求計數（整數）
TTL：3600 秒（1 小時後自動過期）

流程：
1. 組合 key = rate_limit:{ip}:{endpoint}:{當前小時}
2. 從 KV 讀取目前計數
3. 若超過限制 → 回傳 429
4. 計數 +1 寫回 KV（TTL = 3600）
```

| 端點                  | 限制               |
| --------------------- | ------------------ |
| `/api/scrape`         | 每 IP 每小時 10 次 |
| `/api/confirm-import` | 每 IP 每小時 5 次  |

---

## 九、免費方案限制與對應策略

| 服務                  | 免費配額                   | 初期是否足夠 | 注意事項與對策                                                   |
| --------------------- | -------------------------- | ------------ | ---------------------------------------------------------------- |
| Supabase DB           | 500 MB 儲存                | ✅ 充足      | 商品資料以文字為主，圖片外連不入庫                               |
| Supabase Auth         | 50,000 MAU                 | ✅ 充足      | 一般瀏覽不計入 MAU，僅登入評論才計                               |
| Supabase API          | 無限請求                   | ✅ 無限制    | —                                                                |
| Supabase 閒置暫停     | 7 天無活動自動暫停         | ⚠️ 需處理    | ★ 使用 Cloudflare Workers Cron Trigger 定期 ping（基礎設施統一） |
| Cloudflare Pages      | 靜態資源無限               | ✅ 完全無限  | —                                                                |
| Cloudflare Workers    | 每日 100,000 次請求        | ✅ 充足      | 頁面靜態資源不計入；僅 API 呼叫計入                              |
| Cloudflare Workers KV | 每日 100,000 讀 / 1,000 寫 | ✅ 充足      | scrape 快取 + rate limit 合計遠低於上限                          |

> **升級時機建議**：當月活躍評論用戶接近 40,000 人，或資料庫接近 400 MB 時，評估升級 Supabase Pro（$25/月）。Cloudflare 升級（$5/月）則等到每日 API 請求穩定超過 8 萬次再考慮。

---

## 十、UI 設計原則

- **行動優先（Mobile First）**：主要受眾可能透過手機瀏覽
- **簡潔清晰**：商品圖片為主視覺，避免資訊過載
- **快速操作**：首頁搜尋框明顯置頂，讓搜尋是第一動作
- **購買導流明確**：商品頁「購買」按鈕需視覺突出，讓買家清楚知道點擊後會前往賣貨便
- **視覺風格**：使用 Tailwind CSS 和 Daisy UI，使用預設的主題顏色和主題切換功能，再搭配簡單的動畫效果，形成簡潔清爽但帶有質感的風格

---

## 十一、安全性考量

| 項目                | 做法                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| 匯入 API 防機器人   | Cloudflare Turnstile Invisible Mode（使用者無感）                          |
| 匯入 API 防人工濫用 | Workers KV Rate Limit（Edge 層攔截，不打 DB）                              |
| 點擊刷熱度防護      | 同 IP 對同商品每小時最多記錄 3 次（查詢 `purchase_clicks` 表）             |
| 匯入資料真實性      | confirm-import 從 Workers KV 讀取 Server 端快取，不信任前端傳入資料        |
| 商品下架處理        | 重新匯入時，不在新資料中的商品標記為下架（status = 0），不直接刪除         |
| 評論防濫用          | Google OAuth 天然防止匿名洗版；`unique(product_id, user_id)` 防止重複評論  |
| Service Key 保護    | `SUPABASE_SERVICE_KEY` 僅存在於 server-side 環境變數，絕不外露至前端       |
| XSS 防護            | 商品描述含 HTML，前端 `v-html` 渲染前需以 DOMPurify 過濾                   |
| RLS 設定            | 公開讀取的資料表開放 SELECT；所有寫入透過 service key 的 Server Route 進行 |

---

## 十二、開發階段規劃

### Phase 1 — 核心展示（MVP）

- [ ] 依本文件建立完整資料庫 schema（含索引、Trigger、DB Function）
- [ ] 在 Cloudflare Dashboard 建立 Workers KV namespace（scrape 快取 + rate limit）
- [ ] 設定 Cloudflare Workers Cron Trigger，定期 ping Supabase 防止閒置暫停
- [ ] 提前實測 Cloudflare Workers 執行 scrape 的 CPU 時間
- [ ] **★ [修正5] 實際測試 Trigram vs FTS 的中文搜尋品質，確認搜尋策略**
- [ ] 首頁：搜尋框 + 熱門商品列表（讀取 `click_count`）
- [ ] 搜尋結果頁：Trigram 搜尋 + 排序 + 價格篩選
- [ ] 商城頁：商城資訊 + 商品列表
- [ ] 商品詳細頁：商品資訊 + 規格 + 圖片 + 購買按鈕（呼叫 record-click）
- [ ] 商城匯入頁：整合 Turnstile + scrape（存 KV）/ confirm-import（讀 KV）API
- [ ] **★ [修正9] 基礎 SEO 設定：每頁 meta tags、Open Graph、基本 sitemap**

### Phase 2 — 社群互動

- [ ] 評論系統（Google OAuth 登入）
- [ ] 商品詳細頁整合評論列表（含星評顯示）與留言框
- [ ] 評論含 `rating` 欄位（1–5 顆星），顯示平均星評

### Phase 3 — 體驗優化

- [ ] 關於頁（理念、功能介紹、Q&A）
- [ ] **進階 SEO 優化（結構化資料 JSON-LD、動態 sitemap、og:image 自動生成）**
- [ ] 效能優化（圖片 lazy load、分頁或無限捲動）
- [ ] 設定品牌名稱與視覺風格，全站套用

### Phase 4 — 未來擴充（選配）

- [ ] 商家後台（管理自己匯入的商城與點擊統計）
- [ ] `shops` 加入 `click_count`，支援「熱門商城」排行
- [ ] 進階篩選（商城、上架狀態）
- [ ] 升級搜尋引擎（Algolia 或 Meilisearch）
- [ ] 近 N 天熱門加權排序（利用 `purchase_clicks` 時間戳記）

---

## 十三、潛在挑戰與對應策略

| 挑戰                      | 說明                                            | 對策                                                                |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| 資料同步問題              | 賣貨便商品隨時可能下架或改價，本站資料可能過時  | 頁面顯示「資料最後更新時間」；重新匯入時自動標記已消失商品為下架    |
| 圖片來源限制              | 商品圖片直連賣貨便 CDN，未來可能失效或被封鎖    | 初期直連，視情況評估 proxy 或備份                                   |
| Workers CPU 時間限制      | cheerio 解析大型 HTML 可能較耗 CPU              | **Phase 1 早期**提前實測；超限時改用 Workers Unbound                |
| 中文全文搜尋精準度        | PostgreSQL `simple` 字典不支援中文斷詞          | ★ 初期以 Trigram 為搜尋主力；Phase 1 實測搜尋品質；未來考慮 Algolia |
| 搜尋效能瓶頸              | 資料量大時 ILIKE 效能下降                       | Trigram GIN 索引初期應付；達瓶頸時升級 Algolia                      |
| Supabase 免費方案閒置暫停 | 7 天無 API 活動後專案自動暫停                   | ★ 使用 Cloudflare Workers Cron Trigger 定期 keep-alive              |
| KV 快取過期               | 使用者預覽後超過 10 分鐘才確認，快取已失效      | 回傳明確錯誤訊息，引導使用者重新點擊「讀取」即可                    |
| KV Rate Limit 精確度      | Workers KV 非強一致性，高併發下計數可能略有誤差 | 初期流量低，最終一致性已足夠；高流量時可評估 Durable Objects        |

---

## 十四、未來擴充可能性

- **商家後台**：提供匯入賣家查看商城瀏覽與點擊統計的簡單後台
- **商城熱門排行**：為 `shops` 加入 `click_count`，支援首頁熱門商城區塊
- **進階搜尋**：升級至 Algolia 或 Meilisearch，解決中文斷詞問題
- **近期熱門**：利用 `purchase_clicks` 的 `clicked_at` 計算近 7 天熱門商品

---

## 附錄：版本修正項目對照表

### v2.0 → v3.0

| #   | 問題                                         | 修正內容                                                       |
| --- | -------------------------------------------- | -------------------------------------------------------------- |
| 1   | `reviews` 缺少 `rating` 欄位                 | 新增 `rating smallint not null check (rating between 1 and 5)` |
| 2   | `product_specs.external_id` 缺少 unique 約束 | 改為 `external_id text unique`                                 |
| 3   | `scrape` Rate Limit 數字不一致（20 vs 10）   | 統一為每小時 **10 次**                                         |
| 4   | `import_rate_limit` 無清除機制               | 使用 Supabase pg_cron，每日 03:00 清除舊資料                   |
| 5   | 評論可重複留言                               | 新增 `unique(product_id, user_id)` 約束                        |
| 6   | Workers CPU 時間風險未明確處理               | 列入 Phase 1 早期必測項目                                      |
| 7   | `shops` 缺少熱門統計                         | 列入 Phase 4 擴充項目                                          |

### v3.0 → v3.1

| #   | 問題                                 | 修正內容                                                   |
| --- | ------------------------------------ | ---------------------------------------------------------- |
| 8   | confirm-import 重複 scrape，浪費效能 | 改用 Workers KV 快取（TTL 10 分鐘），只 scrape 一次        |
| 9   | Supabase 免費方案閒置暫停風險        | 列入 Phase 1 必處理項目，使用 cron-job.org 定期 keep-alive |
| 10  | 免費方案限制未有文件紀錄             | 新增第八節「免費方案限制與對應策略」                       |

### v3.1 → v3.2

| #   | 問題                                                                | 修正內容                                                                                |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 11  | API 一覽表 `confirm-import` 說明仍寫「重新 scrape」                 | 修正為「從 KV 讀取快取後原子性寫入 DB」                                                 |
| 12  | `purchase_clicks` 缺少 `ip` 欄位，無法實現 IP 防刷                  | 新增 `ip text not null` 欄位與 `(product_id, ip, clicked_at)` 複合索引                  |
| 13  | `record-click` API 流程缺少 IP 防刷邏輯                             | 在步驟 1 與 2 之間加入 IP 頻率檢查（同商品同 IP 每小時 ≤ 3 次）                         |
| 14  | `import_rate_limit` 用 DB 做 Rate Limit，每次請求都打 DB            | 改用 Workers KV Rate Limit，Edge 層攔截；移除 `import_rate_limit` 資料表與 pg_cron      |
| 15  | 中文 FTS 用 `simple` 字典效果差，搜尋不精準                         | 搜尋主力改為 Trigram ILIKE；FTS 保留為未來升級基礎；Phase 1 需實測搜尋品質              |
| 16  | 價格篩選邏輯為「完全包含」，會排除合理商品                          | 改為「區間重疊」邏輯：`p.max_price >= :min_price AND p.min_price <= :max_price`         |
| 17  | 重新匯入時缺少商品下架處理，已消失商品仍顯示為上架                  | 新增軟刪除機制：不在新資料中的商品 `status` 設為 `0`；搜尋只顯示 `status = 1`           |
| 18  | `product_specs` 先刪後寫策略，已有 unique `external_id` 可用 upsert | 規格改用 upsert（依 `external_id`），避免不必要的刪除重建；圖片因無唯一識別仍採先刪後寫 |
| 19  | SEO 放在 Phase 3 太晚，商品頁是主要流量入口                         | 基礎 SEO（meta tags、Open Graph、基本 sitemap）提前至 Phase 1；進階 SEO 保留在 Phase 3  |
| 20  | 閒置保活用外部 cron-job.org，基礎設施分散                           | 改用 Cloudflare Workers Cron Trigger，統一在 Cloudflare 管理                            |
