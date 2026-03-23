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
    } finally {
      loading.value = false;
    }
  }

  async function search(params: SearchParams) {
    currentParams.value = params;
    offset.value = 0;
    await fetchPage(params, true);
  }

  async function loadMore() {
    if (loading.value || !hasMore.value) return;
    await fetchPage(currentParams.value, false);
  }

  return { products, loading, hasMore, search, loadMore };
}
