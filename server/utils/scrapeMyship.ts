import * as cheerio from "cheerio";
import { filterXSS } from "xss";
import type { ShopData, ProductData, SpecData, ImageData } from "./types";

// 允許的 HTML tags/attributes（只保留排版用的，砍掉 script/iframe/on* 等）
const sanitize = (html: string) =>
  filterXSS(html, {
    allowList: {
      p: [],
      br: [],
      span: ["style"],
      b: [],
      strong: [],
      i: [],
      em: [],
      u: [],
      s: [],
      ul: [],
      ol: [],
      li: [],
      a: ["href", "target"],
      img: ["src", "alt"],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  });

export function validateMyshipUrl(url: string): string {
  const base = /^https:\/\/myship\.7-11\.com\.tw\/general\/detail/;
  if (!base.test(url)) {
    throw createError({
      statusCode: 400,
      message:
        "網址格式不正確，請輸入賣貨便賣場網址（https://myship.7-11.com.tw/general/detai...）",
    });
  }
  // /general/detail/GM1234 或 /general/detail?id=GM1234
  const pathMatch = url.match(/\/(GM\w+)/);
  const queryMatch = new URL(url).searchParams.get("id");
  const id =
    pathMatch?.[1] || (queryMatch?.startsWith("GM") ? queryMatch : null);
  if (!id) {
    throw createError({
      statusCode: 400,
      message:
        "網址格式不正確，請輸入賣貨便賣場網址（https://myship.7-11.com.tw/general/detail...）",
    });
  }
  return id;
}

export async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 20);
}

export async function scrapeMyship(url: string): Promise<ShopData> {
  const shopExternalId = validateMyshipUrl(url);

  const html = await $fetch<string>(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    },
    responseType: "text",
  }).catch(() => {
    throw createError({
      statusCode: 502,
      message: "無法存取賣貨便頁面，請確認網址是否正確",
    });
  });

  // 策略一：嘗試從 __NEXT_DATA__ 提取（效能最佳，CPU 用量低）
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const parsed = parseFromNextData(shopExternalId, url, nextData);
      if (parsed) return parsed;
    } catch {
      // fall through
    }
  }

  // 策略二：找含有 Cgdd_Id 的 inline JSON script（賣貨便常見資料格式）
  const inlineJsonMatch = html.match(
    /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})(?:\s*;|\s*<)/,
  );
  if (inlineJsonMatch) {
    try {
      const stateData = JSON.parse(inlineJsonMatch[1]);
      const parsed = parseFromInitialState(shopExternalId, url, stateData);
      if (parsed) return parsed;
    } catch {
      // fall through
    }
  }

  // 策略三：cheerio DOM 解析（fallback）
  return parseFromHtml(shopExternalId, url, html);
}

// ─── 解析策略：__NEXT_DATA__ ───────────────────────────────────────────────────
// 賣貨便若為 Next.js 架構，資料會在 props.pageProps 內
function parseFromNextData(
  shopExternalId: string,
  url: string,
  nextData: Record<string, unknown>,
): ShopData | null {
  try {
    const pageProps = (nextData as any)?.props?.pageProps;
    if (!pageProps) return null;

    // 嘗試找賣場資料（常見欄位名稱）
    const shopInfo =
      pageProps.shopInfo ||
      pageProps.shopData ||
      pageProps.storeInfo ||
      pageProps.generalInfo;

    if (!shopInfo) return null;

    return buildShopData(shopExternalId, url, shopInfo);
  } catch {
    return null;
  }
}

// ─── 解析策略：window.__INITIAL_STATE__ ───────────────────────────────────────
function parseFromInitialState(
  shopExternalId: string,
  url: string,
  state: Record<string, unknown>,
): ShopData | null {
  try {
    const shopInfo =
      (state as any)?.shop ||
      (state as any)?.general ||
      (state as any)?.store ||
      (state as any)?.shopInfo;
    if (!shopInfo) return null;
    return buildShopData(shopExternalId, url, shopInfo);
  } catch {
    return null;
  }
}

// ─── 通用 ShopData builder（從結構化 JSON）───────────────────────────────────
function buildShopData(
  shopExternalId: string,
  url: string,
  raw: Record<string, unknown>,
): ShopData | null {
  // 嘗試多種欄位命名慣例
  const name = str(raw.ShopName || raw.shopName || raw.name || raw.Name || "");
  if (!name) return null;

  const imageUrl = str(
    raw.ShopImageUrl ||
      raw.shopImageUrl ||
      raw.image_url ||
      raw.imageUrl ||
      raw.logo ||
      "",
  );
  const description = str(
    raw.Description || raw.description || raw.intro || raw.Intro || "",
  );

  // 找商品列表
  const rawProducts: unknown[] = (raw.ProductList ||
    raw.productList ||
    raw.products ||
    raw.Products ||
    raw.goodsList ||
    raw.GoodsList ||
    []) as unknown[];

  const products: ProductData[] = rawProducts.map((p: any, idx: number) =>
    buildProductData(p, idx),
  );

  return {
    external_id: shopExternalId,
    name,
    shop_url: url,
    image_url: imageUrl,
    description,
    products,
  };
}

function buildProductData(
  p: Record<string, unknown>,
  _idx: number,
): ProductData {
  const externalId = str(
    p.Cgdd_Id || p.cgdd_id || p.productId || p.ProductId || p.id || "",
  );
  const name = str(
    p.CgddName || p.cgddName || p.name || p.Name || p.productName || "",
  );
  const description = str(p.Description || p.description || p.intro || "");
  const mainImage = str(
    p.MainImage || p.mainImage || p.image || p.Image || p.imgUrl || "",
  );
  const minOrder = num(p.MinOrder || p.minOrder || p.min_order || 0);
  const maxOrder = num(p.MaxOrder || p.maxOrder || p.max_order || 0);

  const rawSpecs: unknown[] = (p.SpecList ||
    p.specList ||
    p.specs ||
    p.Specs ||
    []) as unknown[];
  const specs: SpecData[] = rawSpecs.map((s: any) => buildSpecData(s));

  const rawImages: unknown[] = (p.ImageList ||
    p.imageList ||
    p.images ||
    p.Images ||
    []) as unknown[];
  const images: ImageData[] = rawImages.map((img: any, i: number) => ({
    url: str(img.url || img.Url || img.imgUrl || img.ImageUrl || img),
    ordering: num(img.ordering || img.Order || img.sort || i),
  }));

  // 若沒有 images 但有 mainImage，補一張
  if (images.length === 0 && mainImage) {
    images.push({ url: mainImage, ordering: 0 });
  }

  return {
    external_id: externalId,
    name,
    description,
    main_image: mainImage,
    min_order: minOrder,
    max_order: maxOrder,
    specs,
    images,
  };
}

function buildSpecData(s: Record<string, unknown>): SpecData {
  const price = num(s.Price || s.price || s.salePrice || 0);
  const salePrice = num(s.SalePrice || s.sale_price || s.discountPrice || 0);
  return {
    external_id: str(
      s.Cgds_Id || s.cgds_id || s.specId || s.SpecId || s.id || "",
    ),
    name: str(s.SpecName || s.specName || s.name || s.Name || ""),
    price,
    sale_price: salePrice,
    image: str(s.SpecImage || s.specImage || s.image || ""),
    stock: num(s.Stock || s.stock || s.inventory || 0),
  };
}

// ─── 解析策略：cheerio DOM fallback ───────────────────────────────────────────
// 賣貨便為傳統 ASP.NET MVC SSR，商品資料完整存於 data-product JSON attribute
function parseFromHtml(
  shopExternalId: string,
  url: string,
  html: string,
): ShopData {
  const $ = cheerio.load(html);

  // 賣場名稱
  const name =
    $('meta[property="og:title"]').attr("content") ||
    $("a.index-title span").first().text().trim() ||
    $("title")
      .text()
      .replace(/[|\-–].*$/, "")
      .trim() ||
    shopExternalId;

  // 賣場主圖（og:image 為相對路徑）
  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const imageUrl = ogImage
    ? ogImage.startsWith("http")
      ? ogImage
      : `https://myship.7-11.com.tw${ogImage}`
    : "";

  // 賣場說明：.col-lg-12.mb-20 下，去掉第一個「賣場說明：」段落
  const $descContainer = $(".main_content .col-lg-12.mb-20").clone();
  $descContainer.find("p").first().remove();
  const description = sanitize($descContainer.html()?.trim() || "");

  // 商品列表：只取 div.product，避免 .magnific-popup-ajax 上的重複 data-product
  const products: ProductData[] = [];
  const seen = new Set<string>();

  $("div.product[data-product]").each((i, el) => {
    const raw = $(el).attr("data-product");
    if (!raw) return;

    let p: Record<string, unknown>;
    try {
      p = JSON.parse(raw);
    } catch {
      return;
    }

    const externalId = str(p.Cgdd_Id || `UNKNOWN_${i}`);
    if (seen.has(externalId)) return;
    seen.add(externalId);

    const productName = str(p.Cgdd_Product_Name || "");
    const desc = sanitize(str(p.Cgdd_Product_Description || ""));

    const imgBase = `https://myship.7-11.com.tw/i/cgdm/${shopExternalId}/`;
    const goodsFirstImg = str(p.GoodsFirstImg || "");
    const mainImage = goodsFirstImg ? `${imgBase}${goodsFirstImg}` : "";

    // 規格（JSON Spec array）
    const rawSpecs = (p.Spec as any[]) || [];
    const specs: SpecData[] = rawSpecs.map((s) => ({
      external_id: str(s.Cgds_Id || ""),
      name: str(s.Cgds_Spec || ""),
      price: num(s.Cgds_Price ?? 0),
      sale_price: num(s.Cgds_SPrice ?? 0),
      image: s.Cgds_CgimImagePath ? `${imgBase}${s.Cgds_CgimImagePath}` : "",
      stock: num(s.Inventory ?? s.Cgds_Inventory ?? 0),
    }));

    // 商品圖片（JSON Images array）
    const rawImages = (p.Images as any[]) || [];
    const images: ImageData[] = rawImages
      .sort((a, b) => (a.Cgim_Ordering ?? 0) - (b.Cgim_Ordering ?? 0))
      .map((img) => ({
        url: `${imgBase}${img.Cgim_Image_Path}`,
        ordering: num(img.Cgim_Ordering ?? 0),
      }));

    if (images.length === 0 && mainImage) {
      images.push({ url: mainImage, ordering: 0 });
    }

    products.push({
      external_id: externalId,
      name: productName,
      description: desc,
      main_image: mainImage,
      min_order: num(p.Cgdd_Product_MinOrder ?? 0),
      max_order: num(p.Cgdd_Product_MaxOrder ?? 0),
      specs,
      images,
    });
  });

  if (products.length === 0) {
    throw createError({
      statusCode: 422,
      message:
        "無法解析賣場商品資料，請確認網址正確，或聯絡管理員（CSS selector 可能需要更新）",
    });
  }

  return {
    external_id: shopExternalId,
    name,
    shop_url: url,
    image_url: imageUrl,
    description,
    products,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function num(val: unknown): number {
  const n = parseInt(String(val ?? 0), 10);
  return isNaN(n) ? 0 : n;
}

function parsePrice(text: string): number {
  const match = text.replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}
