<p align="center">
  <img src="public/favicon.png" alt="myshipbang Logo" width="120" height="120">
</p>

<h1 align="center">myshipbang — 賣貨便自架商城</h1>

<p align="center">
  <strong>為賣貨便（7-11 myship）賣家打造的商品展示網站</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Nuxt-4-00DC82" alt="Nuxt 4">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020" alt="Cloudflare Workers">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E" alt="Supabase">
</p>

---

## 📖 簡介

**myshipbang** 是為賣貨便賣家打造的商品展示平台。賣貨便官方平台缺乏獨立商品頁面與搜尋功能，本站作為「展示層」填補這個缺口——不經手任何金流，所有購買行為皆導向賣貨便原始頁面完成交易。

### 為什麼選擇 myshipbang？

- 🔍 **完整搜尋功能** - 支援商品名稱與商城名稱的模糊搜尋，排序、價格篩選一應俱全
- 📦 **獨立商品頁面** - 每件商品擁有專屬頁面，含規格、圖片、評論與購買按鈕
- 🚀 **一鍵匯入** - 貼上賣貨便網址即可自動抓取並建立完整商城展示頁
- ⭐ **評論系統** - 透過 Google 登入留下星評與文字評論
- 🔥 **熱門排序** - 依購買點擊數自動排序，讓熱賣商品自然曝光
- 🌐 **全球部署** - Cloudflare Pages + Workers，低延遲全球 CDN

---

## ✨ 功能特色

### 🗂️ 頁面規劃

| 頁面     | 路由            | 說明                                  |
| -------- | --------------- | ------------------------------------- |
| 首頁     | `/`             | 搜尋框 + 熱門商品列表                 |
| 搜尋結果 | `/search`       | Trigram 模糊搜尋 + 排序 + 價格篩選    |
| 商城頁   | `/shop/[id]`    | 商城資訊 + 該商城商品列表             |
| 商品詳細 | `/product/[id]` | 商品資訊、規格、圖片、評論 + 購買按鈕 |
| 商城匯入 | `/import`       | 輸入賣貨便網址 → 預覽 → 確認匯入      |
| 關於     | `/about`        | 網站理念、功能介紹、Q&A               |

### 🔍 搜尋與排序

- **搜尋範圍**：商品名稱（主力）+ 商城名稱（輔助）
- **排序選項**：熱門程度（預設）、價格低到高 / 高到低、更新時間
- **價格篩選**：區間重疊邏輯（商品價格範圍與篩選範圍有交集即顯示）
- **搜尋引擎**：PostgreSQL Trigram GIN 索引，中文無需斷詞

### 📥 商城匯入

- 無需登入，任何人皆可使用，雙層防濫用保護
- Cloudflare Turnstile（擋機器人）+ Workers KV Rate Limit（擋人工濫用）
- 匯入流程：輸入網址 → Scrape 結果存入 KV（10 分鐘快取）→ 預覽確認 → 原子性寫入 DB
- 重複匯入同一賣場執行 upsert；原有商品若不在新資料中則標記為下架（保留歷史評論與點擊）

### ⭐ 評論系統

- 需透過 Google OAuth 登入後才能留言
- 評分（1–5 顆星）+ 留言文字，每位使用者對同一商品只能留一則評論
- 未登入者可瀏覽評論

### 🔥 熱門度機制

- 點擊商品詳細頁的「購買」按鈕觸發記錄
- 同一 IP 對同一商品每小時最多記錄 3 次，防止刷熱度
- 熱門排序直接讀取 `click_count` 快取欄位，不做子查詢

---

## 🏗️ 技術架構

| 層級                  | 技術                                    | 說明                                    |
| --------------------- | --------------------------------------- | --------------------------------------- |
| **前端框架**          | Nuxt 4 + Vue 3                          | SSR/SSG 支援，SEO 友好                  |
| **UI**                | Tailwind CSS v4 + DaisyUI               | Mobile First，多主題切換                |
| **後端**              | Nuxt Server Routes → Cloudflare Workers | `/server/api/` 自動部署為 Workers       |
| **資料庫**            | Supabase (PostgreSQL)                   | 資料儲存 + Auth + pg_trgm               |
| **身份驗證**          | Supabase Auth（Google OAuth）           | 僅用於評論功能                          |
| **HTML 解析**         | cheerio                                 | 抓取賣貨便賣場頁面                      |
| **搜尋**              | PostgreSQL Trigram（主力）+ FTS（備援） | 中文模糊搜尋                            |
| **快取 / Rate Limit** | Cloudflare Workers KV                   | Scrape 暫存（TTL 10 分鐘）+ IP 頻率限制 |
| **防機器人**          | Cloudflare Turnstile                    | Invisible Mode，使用者無感              |
| **部署**              | Cloudflare Pages + Workers              | 全球 CDN                                |
| **PWA**               | @vite-pwa/nuxt                          | 支援安裝至裝置                          |

---

## 📚 使用指南

### 1. 匯入商城

1. 前往 `/import` 頁面
2. 貼上賣貨便賣場網址（格式：`https://myship.7-11.com.tw/general/detail/GM...`）
3. 完成人機驗證後點擊「讀取賣場資料」
4. 確認預覽內容後點擊「確認匯入」

### 2. 搜尋商品

1. 在首頁搜尋框輸入關鍵字
2. 可依熱門程度、價格、更新時間排序
3. 可設定價格區間篩選

### 3. 購買商品

1. 進入商品詳細頁
2. 點擊「購買」按鈕，將前往賣貨便原始頁面完成交易

### 4. 撰寫評論

1. 登入 Google 帳號
2. 在商品詳細頁下方填寫星評與文字評論

---

## ⚙️ 本地開發

### 環境需求

- Node.js 20+
- pnpm
- Cloudflare 帳號（Workers KV、Turnstile）
- Supabase 專案

### 安裝與啟動

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

### 建置與部署

```bash
pnpm build
pnpm preview    # 本地預覽 production build

# 部署至 Cloudflare
pnpm wrangler pages deploy
```

### 資料庫初始化

依序執行 `supabase/` 目錄下的 SQL：

```bash
supabase/01_schema.sql    # 資料表、索引、Trigger
supabase/02_functions.sql # DB Function（原子性匯入）
supabase/03_rls.sql       # RLS 政策
```

---

## 🔌 API

| Endpoint                   | 說明                           | 防護                                            |
| -------------------------- | ------------------------------ | ----------------------------------------------- |
| `POST /api/scrape`         | 抓取賣場，存入 KV，不寫入 DB   | Turnstile + KV Rate Limit（每 IP 每小時 10 次） |
| `POST /api/confirm-import` | 從 KV 讀取快取後原子性寫入 DB  | Turnstile + KV Rate Limit（每 IP 每小時 5 次）  |
| `POST /api/record-click`   | 記錄購買點擊，`click_count` +1 | IP Rate Limit（同商品每小時 3 次）              |

---

## 📄 授權

本專案為私人專案，保留所有權利。

---

<p align="center">
  Made with ❤️ for 賣貨便賣家
</p>
