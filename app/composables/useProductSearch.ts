export interface ProductSearchResult {
  id: string;
  name: string;
  main_image: string | null;
  min_price: number;
  max_price: number;
  click_count: number;
  updated_at: string;
  shop_name: string;
  shop_id: string;
}

export interface SearchParams {
  q?: string;
  sort?: "popular" | "price_asc" | "price_desc" | "newest";
  minPrice?: number;
  maxPrice?: number;
}

const PAGE_SIZE = 20;

export function useProductSearch() {
  const products = ref<ProductSearchResult[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const offset = ref(0);
  const currentParams = ref<SearchParams>({});
  const { minLoadingTime } = useMinLoadingTime();

  /**
   * 讀取指定頁面或重新搜尋商品資料
   * @param {SearchParams} params - 搜尋條件，包含關鍵字、價格區間等
   * @param {boolean} reset - 是否重置資料（第一頁或切換條件時）
   * @returns {Promise<void>} 無回傳值，直接更新內部響應式狀態
   */
  async function fetchPage(params: SearchParams, reset: boolean) {
    loading.value = true;
    try {
      const query: Record<string, string | number> = {};
      if (params.q) query.q = params.q;
      if (params.sort) query.sort = params.sort;
      if (params.minPrice != null) query.min_price = params.minPrice;
      if (params.maxPrice != null) query.max_price = params.maxPrice;
      query.offset = reset ? 0 : offset.value;

      const result = await minLoadingTime(
        $fetch<ProductSearchResult[]>("/api/products/search", { query }),
      );

      if (reset) {
        products.value = result;
        offset.value = result.length;
      } else {
        products.value.push(...result);
        offset.value += result.length;
      }
      hasMore.value = result.length === PAGE_SIZE;
    } catch (err) {
      // reset 時清空，避免顯示舊資料；loadMore 失敗則保留現有結果
      if (reset) {
        products.value = [];
        hasMore.value = false;
      }
      useToast().error("載入商品失敗，請稍後再試");
      console.error("[useProductSearch] fetchPage error:", err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 根據新參數發起全新搜尋（帶入 minLoadingTime 避免閃爍）
   * @param {SearchParams} params - 搜尋條件
   * @returns {Promise<void>}
   */
  async function search(params: SearchParams) {
    currentParams.value = params;
    offset.value = 0;
    await fetchPage(params, true);
  }

  /**
   * 載入下一頁（無限捲動模式使用）
   * @returns {Promise<void>}
   */
  async function loadMore() {
    if (loading.value || !hasMore.value) return;
    await fetchPage(currentParams.value, false);
  }

  function setProducts(
    items: ProductSearchResult[],
    more: boolean,
    params: SearchParams,
  ) {
    products.value = items;
    offset.value = items.length;
    hasMore.value = more;
    currentParams.value = params;
  }

  return { products, loading, hasMore, search, loadMore, setProducts };
}
