# 前端開發代碼優化與規範指南 (Standard Guidelines)

## 1. 代碼風格與可維護性 (Readability & Maintainability)

高品質的代碼首先要「好讀」。

- **命名規範：**
  - **變數/函數：** 使用具備描述性的 `camelCase`（如 `isUserLoggedIn` 而非 `isLogin`）。
  - **組件：** 統一使用 `PascalCase`（如 `UserCard.vue`）。
  - **常數：** 全大寫並使用底線分隔（如 `MAX_RETRY_COUNT`）。

---

## 2. 代碼組織與區塊順序 (Code Organization)

為了降低接手者的理解成本，所有 JS/TS 檔案（或 Vue/React 組件內的 Script 區塊）應遵循「由外到內、由靜到動」的固定順序：

1. **外部引用 (Imports):**
   - 先引用第三方庫（如 `vue`, `axios`）。
   - 後引用專案內部資源（如 `@/components`, `@/utils`）。
   - 最後引用樣式檔或靜態資源。

2. **類型定義 (Type Definitions):** 僅限 TypeScript，定義 Interface 或 Type。
3. **常量宣告 (Constants):** 檔案內共用的靜態配置，命名使用全大寫（如 `MAX_RETRY = 3`）。
4. **響應式狀態/變數 (State/Variables):** 如 Vue 的 `ref`/`reactive` 或 React 的 `useState`。
5. **計算屬性 (Computed Properties):** 依賴於狀態的衍生數據。
6. **核心邏輯與函數 (Functions/Methods):** 業務邏輯、API 請求函數等。
7. **偵聽器 (Watchers):** 監控數據變化的邏輯。（_註：放在函數之後是為了避免 `immediate: true` 時發生 ReferenceError_）
8. **生命週期鉤子 (Lifecycle Hooks):** 如 `onMounted`, `useEffect` 等。
9. **其他**
10. **對外暴露 (Expose/Exports):** 組件導出的屬性或方法。

---

## 3. 註解規範 (Commenting Standards)

註解的目的是解釋「為什麼這麼做」，而非「這段程式碼在做什麼」。

- **規則：** 必須使用繁體中文註解。
- **JSDoc 函數註解：** 所有的公用函數、複雜的業務邏輯函數必須使用 JSDoc 格式，標明參數與回傳值。

```javascript
/**
 * 計算訂單總額
 * @param {Array} items - 商品列表
 * @param {Number} discount - 折扣率 (0-1)
 * @returns {Number} 格式化後的總金額
 */
const calculateTotal = (items, discount) => {
  // 實作邏輯
};
```

- **關鍵邏輯說明：** 在複雜算法或非直覺的 Bug 修復旁，加上簡短說明。
- **TODO 標記：** 尚未完成或待優化的部分，統一標記為 `// TODO: [姓名] 待處理事項`。
- **避免冗餘：** 不要為一眼就能看懂的程式碼寫註解（如 `let i = 0; // 初始化 i 為 0`）。

---

## 4. 代碼風格與結構優化 (Clean Code)

- **衛句模式 (Guard Clauses):** 減少巢狀結構，讓錯誤處理優先返回。

```javascript
// 推薦做法
if (!data) return;
if (data.status !== 200) throw new Error("Failed");
// ... 執行主體邏輯
```

- **單一職責 (SRP):** 一般情況下一個函數或組件應只處理一件事情。超過 500 行的組件應考慮拆分。
- **命名語義化：**
  - 布林值：以 `is`, `has`, `should` 開頭（如 `isVisible`）。
  - 事件處理：以 `handle` 開頭（如 `handleBtnClick`）。

---

## 5. 效能優化與資源管理 (Performance)

### 5.1 渲染優化

- **列表渲染：** `key` 值嚴禁使用 `index`（除非列表內容絕對不會變動）。
- **高頻事件處理：** `scroll`, `input` 等高頻事件必須使用 **防抖 (Debounce)** 或 **節流 (Throttle)**。

```javascript
import { debounce, throttle } from "lodash-es";

// 防抖範例（適合搜索框輸入）
const handleSearch = debounce((keyword) => {
  // 發送 API 請求
  searchAPI(keyword);
}, 300);

// 節流範例（適合滾動事件）
const handleScroll = throttle(() => {
  // 處理滾動邏輯
  updateScrollPosition();
}, 100);
```

- **避免不必要的重新渲染：** 合理使用 `memo`、`computed` 或 `watch`。

### 5.2 加載優化

- **路由懶加載：** 使用 `() => import('./View.vue')`。
- **圖片優化：**
  - 優先使用 WebP 格式
  - 對首屏以外的圖片實施 Lazy Loading
  - 為關鍵 LCP 圖片添加 `fetchpriority="high"` 屬性
- **組件異步加載：** 對於首屏非必要的重型組件（如彈窗、圖表），應使用異步加載。

### 5.3 瀏覽器優化

- **View Transitions API：** 使用 View Transitions API 進行頁面轉場，減少白屏時間。
  - ⚠️ 需檢查瀏覽器支援度 (`document.startViewTransition`)
  - 不支援時應有降級方案（傳統 CSS 過渡）

```javascript
// 漸進增強範例
if (document.startViewTransition) {
  document.startViewTransition(() => updateDOM());
} else {
  updateDOM(); // 降級處理
}
```

- **Speculation Rules API：** 使用 Speculation Rules API 進行資源預加載，減少加載時間。
  - ⚠️ 目前僅 Chromium 系瀏覽器支援
- **Fetch Priority：** 為最重要的 LCP 圖片添加優先級屬性。

```html
<img src="hero.jpg" fetchpriority="high" alt="主視覺圖" />
```

- **103 Early Hints：** 使用 103 Early Hints 進行資源預加載，減少加載時間。

- **BFcache (Back/Forward Cache)：**
  - ⚠️ **絕對不要使用 `unload` 事件**，這會破壞 BFcache
  - 改用 `pagehide` 事件

```javascript
// ❌ 錯誤：破壞 BFcache
window.addEventListener("unload", () => {
  // 清理邏輯
});

// ✅ 正確：保持 BFcache
window.addEventListener("pagehide", () => {
  // 清理邏輯
});
```

---

## 6. 安全與健壯性 (Security & Robustness)

### 6.1 輸入驗證與安全

- **輸入過濾：** 所有的用戶輸入必須進行清理（Sanitize），防止 XSS 攻擊。

```javascript
import DOMPurify from "dompurify";

// 清理用戶輸入的 HTML
const cleanHTML = DOMPurify.sanitize(userInput);
```

### 6.2 Loading 狀態管理

- **規則：** 所有 loading 處理至少必須有 300ms 的延遲，避免閃爍。

```javascript
/**
 * 確保最小 loading 時間，避免閃爍
 * @param {Promise} promise - 要執行的異步操作
 * @param {Number} minTime - 最小顯示時間（毫秒）
 * @returns {Promise} 執行結果
 */
const minLoadingTime = async (promise, minTime = 300) => {
  const [result] = await Promise.all([
    promise,
    new Promise((resolve) => setTimeout(resolve, minTime)),
  ]);
  return result;
};

// 使用範例
const fetchData = async () => {
  setLoading(true);
  try {
    const data = await minLoadingTime(api.getData(), 300);
    setData(data);
  } finally {
    setLoading(false);
  }
};
```

### 6.3 錯誤處理

- **API 請求：** 必須包含 `try-catch` 或 `.catch()`。
- **API 數據容錯：** 永遠假設後端回傳的數據可能缺失或格式錯誤。
- **規則：** 使用數據前必須進行**空值檢查**。

```javascript
// 推薦：使用 Optional Chaining 與預設值
const userName = userInfo?.profile?.name ?? "訪客";
const items = response?.data?.items ?? [];
```

### 6.4 魔術字串常量化

- **規則：** 禁止直接在邏輯中比對字串（如 `if (status === 'success')`）。
- **優化：** 統一定義為物件或列舉 (Enum)。

```javascript
// 定義常量
const ORDER_STATUS = {
  SUCCESS: "success",
  PENDING: "pending",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

// 使用常量
if (order.status === ORDER_STATUS.SUCCESS) {
  // 處理成功邏輯
}
```

---

## 7. 邏輯抽離與組件解耦 (Architecture)

高品質代碼的標誌是「邏輯」與「渲染」的分離。

### 7.1 Composables / Hooks 優先

避免將複雜的 API 請求或資料處理邏輯直接寫在組件 (`.vue` 或 `.jsx`) 裡。

- **規則：** 超過 10 行的純邏輯（非 UI 控制）應抽離至獨立的函式（如 Vue 的 Composables 或 React 的 Hooks），方便單獨測試與重複使用。

```javascript
// useUserData.js
export const useUserData = () => {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchUser = async (userId) => {
    loading.value = true;
    try {
      const response = await api.getUser(userId);
      user.value = response.data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return { user, loading, error, fetchUser };
};
```

### 7.2 容器與展示組件 (Container & Presentational)

- **展示組件：** 只負責 UI，透過 `props` 接收數據，透過 `emit/callback` 傳出事件，不持有複雜狀態。
- **容器組件：** 負責與 Store、API 溝通，並將數據傳給展示組件。

```vue
<!-- UserCard.vue - 展示組件 -->
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <button @click="$emit('edit', user.id)">編輯</button>
  </div>
</template>

<script setup>
defineProps(["user"]);
defineEmits(["edit"]);
</script>
```

```vue
<!-- UserContainer.vue - 容器組件 -->
<template>
  <UserCard :user="user" @edit="handleEdit" />
</template>

<script setup>
const { user, fetchUser } = useUserData();
const handleEdit = (id) => {
  // 處理編輯邏輯
};
</script>
```

---

## 8. 狀態管理規範 (State Management)

錯誤的狀態管理是前端 Bug 的最大來源。

### 8.1 單一事實來源 (Single Source of Truth)

- **規則：** 絕對不要在組件內「同步」兩份數據。例如：不要將 `props` 傳進來的資料存入 `data` 或 `ref` 再次修改，應直接使用或透過 `computed` (計算屬性) 衍生。

```javascript
// ❌ 錯誤：複製 props 到本地狀態
const props = defineProps(["items"]);
const localItems = ref([...props.items]); // 會導致同步問題

// ✅ 正確：使用 computed
const props = defineProps(["items"]);
const sortedItems = computed(() => {
  return [...props.items].sort((a, b) => a.id - b.id);
});
```

### 8.2 最小化狀態

只有「無法由其他數據推導出來」的東西才叫狀態。

- **錯誤範例：** 同時存 `items` 和 `itemCount`。
- **正確範例：** 只存 `items`，`itemCount` 透過 `items.length` 計算。

```javascript
// ❌ 錯誤：冗餘狀態
const items = ref([]);
const itemCount = ref(0);

// ✅ 正確：衍生數據使用 computed
const items = ref([]);
const itemCount = computed(() => items.value.length);
```

---

## 11. 樣式規範 (Styling Standards)

### 11.1 命名方式

- **選擇一種方法論並保持一致：**
  - BEM (Block Element Modifier)
  - Utility-First (Tailwind CSS)
- **Class 命名使用 `kebab-case`**

```css
/* BEM 範例 */
.user-card {
}
.user-card__title {
}
.user-card__title--highlighted {
}
```

### 11.2 避免內聯樣式

除非是動態計算的值，否則避免使用內聯樣式。

```vue
<!-- ❌ 避免 -->
<div style="color: red; margin: 10px;">內容</div>

<!-- ✅ 推薦 -->
<div class="error-message">內容</div>

<!-- ✅ 動態值可以使用 -->
<div :style="{ width: `${progress}%` }">進度條</div>
```

### 11.3 CSS 變數

主題色、間距等統一定義在 CSS 變數中，方便維護與切換主題。

```css
:root {
  /* 顏色系統 */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;

  /* 間距系統 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* 圓角 */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}

/* 使用範例 */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
}
```

### 11.4 響應式設計

- **優先使用 Mobile-First 設計**

```css
/* Mobile-First 寫法 */
.container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}
```

---

## 12. 無障礙規範 (Accessibility)

### 12.1 語義化 HTML

使用正確的 HTML 標籤，不要用 `<div>` 或 `<span>` 代替語義化元素。

```html
<!-- ❌ 錯誤 -->
<div onclick="handleClick()">點擊我</div>

<!-- ✅ 正確 -->
<button type="button" @click="handleClick">點擊我</button>
```

### 12.2 ARIA 屬性

為非標準互動元素添加適當的 ARIA 屬性。

```html
<!-- 自訂下拉選單 -->
<div
  role="combobox"
  aria-expanded="false"
  aria-haspopup="listbox"
  aria-label="選擇國家"
>
  <button aria-label="開啟選單">選擇...</button>
  <ul role="listbox" aria-hidden="true">
    <li role="option">台灣</li>
    <li role="option">日本</li>
  </ul>
</div>
```

### 12.3 鍵盤導航

- **確保所有互動元素可用 Tab 鍵訪問**
- **支援 Enter/Space 觸發按鈕**
- **支援 Esc 關閉彈窗/下拉選單**

```javascript
// 範例：處理鍵盤事件
const handleKeyDown = (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleSubmit();
  }
};
```

### 12.4 顏色對比度

- **文字與背景對比度至少 4.5:1** (WCAG AA 標準)
- **大字體（18pt 以上）至少 3:1**
- 使用工具檢測：[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 12.5 焦點指示器

不要移除 `:focus` 樣式，或提供更明顯的替代方案。

```css
/* ❌ 絕對不要這樣做 */
* {
  outline: none;
}

/* ✅ 提供清晰的焦點樣式 */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 12.6 圖片替代文字

所有圖片必須有 `alt` 屬性。

```html
<!-- 有意義的圖片 -->
<img src="logo.png" alt="公司 Logo - 回到首頁" />

<!-- 裝飾性圖片 -->
<img src="decoration.png" alt="" role="presentation" />
```

---

## 13. 環境配置規範 (Configuration)

### 13.1 敏感資訊保護

- **絕對不要將 API Key、密碼、Token 等敏感資訊提交到 Git**
- 使用 `.gitignore` 排除環境變數檔案

```bash
# .gitignore
.env
.env.local
.env.*.local
```

### 13.2 環境變數

- 使用 `.env.example` 提供範本
- 在 README 中說明所需的環境變數

```bash
# .env.example
VITE_API_URL=https://api.example.com
VITE_API_KEY=your_api_key_here
VITE_GA_ID=UA-XXXXXXXXX-X
```

### 13.3 配置集中化

所有配置統一放在 `config/` 目錄，避免散落各處。

```javascript
// ❌ 錯誤：硬編碼
const API_URL = "https://api.example.com";
const TIMEOUT = 5000;

// ✅ 正確：使用環境變數
// config/api.js
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 5000,
  headers: {
    "Content-Type": "application/json",
  },
};
```

### 13.4 多環境配置

針對不同環境（開發、測試、生產）使用不同的設定檔。

```
.env.development    # 開發環境
.env.staging        # 測試環境
.env.production     # 生產環境
```

---

## 14. Code Review Checklist

### 14.1 代碼組織

- [ ] 代碼是否符合本規範的組織順序（Imports → Types → Constants → State → Computed → Functions → Watchers → Lifecycle）？
- [ ] 組件是否過於龐大（超過 500 行）？是否需要拆分？
- [ ] 是否有重複代碼可以抽離為共用函數？

### 14.2 命名與註解

- [ ] 變數、函數命名是否具有描述性？
- [ ] 是否有魔術字串未常量化？
- [ ] 註解是否清晰？是否有冗餘註解？
- [ ] 複雜邏輯是否有 JSDoc 說明？

### 14.3 錯誤處理與容錯

- [ ] 是否有適當的錯誤處理（try-catch）？
- [ ] API 數據是否有空值檢查（Optional Chaining）？
- [ ] Loading 狀態是否有最小顯示時間（避免閃爍）？

### 14.4 效能

- [ ] 是否有未防抖/節流的高頻事件（scroll, input, resize）？
- [ ] 列表渲染的 `key` 是否正確（避免使用 index）？
- [ ] 是否有不必要的重新渲染？
- [ ] 大型組件是否使用懶加載？

### 14.5 安全性

- [ ] 用戶輸入是否經過清理（防止 XSS）？
- [ ] 敏感資訊是否有暴露在前端代碼中？
- [ ] 是否正確使用 HTTPS？

### 14.6 無障礙

- [ ] 是否使用語義化 HTML 標籤？
- [ ] 互動元素是否可用鍵盤操作？
- [ ] 圖片是否有 `alt` 屬性？
- [ ] 顏色對比度是否符合標準？

### 14.8 其他

- [ ] Commit message 是否符合規範？
- [ ] 是否有更新相關文檔？
- [ ] 是否有破壞性變更需要通知團隊？

---

## 15. 常見反模式 (Anti-Patterns)

### 15.1 避免的寫法

```javascript
// ❌ 使用 var
var count = 0;

// ✅ 使用 const/let
const MAX_COUNT = 10;
let count = 0;

// ❌ 使用 == 比較
if (value == '1') { }

// ✅ 使用 === 比較
if (value === '1') { }

// ❌ 直接修改 props
props.user.name = 'New Name';

// ✅ 使用 emit 通知父組件
emit('update:user', { ...props.user, name: 'New Name' });

// ❌ 在循環中使用 async/await
for (const item of items) {
  await processItem(item); // 會依序執行，很慢
}

// ✅ 使用 Promise.all 並行處理
await Promise.all(items.map(item => processItem(item)));

// ❌ 濫用 any 類型（TypeScript）
const data: any = fetchData();

// ✅ 定義具體類型
interface UserData {
  id: number;
  name: string;
}
const data: UserData = fetchData();
```

### 15.2 過度設計

- 不要為了「未來可能需要」而過度抽象
- 先寫能運作的代碼，再重構
- YAGNI 原則：You Aren't Gonna Need It

---

## 附錄：參考資源

- [Vue.js 風格指南](https://vuejs.org/style-guide/)
- [React 官方文檔](https://react.dev/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG 無障礙標準](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**版本：** 1.0.0  
**最後更新：** 2026-02-03  
**維護者：** 前端開發團隊
