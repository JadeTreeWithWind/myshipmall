export interface SpecData {
  external_id: string
  name: string
  price: number
  sale_price: number
  image: string
  stock: number
}

export interface ImageData {
  url: string
  ordering: number
}

export interface ProductData {
  external_id: string
  name: string
  description: string
  main_image: string
  min_order: number
  max_order: number
  specs: SpecData[]
  images: ImageData[]
}

export interface ShopData {
  external_id: string
  name: string
  shop_url: string
  image_url: string
  description: string
  products: ProductData[]
}
