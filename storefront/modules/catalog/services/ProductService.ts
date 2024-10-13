import { ProductSlug } from '../../cart/models/ProductSlug';
import { ProductDetail } from '../models/ProductDetail';
import { ProductAll, ProductFeature } from '../models/ProductFeature';
import { ProductOptionValueGet } from '../models/ProductOptionValueGet';
import { ProductVariation } from '../models/ProductVariation';
import { ProductsGet } from '../models/ProductsGet';
import apiClientService from '@/common/services/ApiClientService';

export async function getFeaturedProducts(pageNo: number): Promise<ProductFeature> {
  const response = await apiClientService.get(
    `api/product/storefront/products/featured?pageNo=${pageNo}`
  );
  return response.json();
}

export async function getProductDetail(slug: string): Promise<ProductDetail> {
  const response = await apiClientService.get(
    process.env.API_BASE_PATH + '/product/storefront/product/' + slug
  );
  return response.json();
}

export async function getProductOptionValues(productId: number): Promise<ProductOptionValueGet[]> {
  const res = await apiClientService.get(
    `${process.env.API_BASE_PATH}/product/storefront/product-option-combinations/${productId}/values`
  );
  if (res.status >= 200 && res.status < 300) return res.json();
  throw res;
}

export async function getProductByMultiParams(queryString: string): Promise<ProductAll> {
  const res = await apiClientService.get(`/api/product/storefront/products?${queryString}`);
  return res.json();
}

export async function getProductVariationsByParentId(
  parentId: number
): Promise<ProductVariation[]> {
  const res = await apiClientService.get(
    `${process.env.API_BASE_PATH}/product/storefront/product-variations/${parentId}`
  );
  if (res.status >= 200 && res.status < 300) return res.json();
  throw res;
}

export async function getProductSlug(productId: number): Promise<ProductSlug> {
  const res = await apiClientService.get(`/api/product/storefront/productions/${productId}/slug`);
  if (res.status >= 200 && res.status < 300) return res.json();
  throw res;
}

export async function getRelatedProductsByProductId(productId: number): Promise<ProductsGet> {
  const res = await apiClientService.get(
    `/api/product/storefront/products/related-products/${productId}`
  );
  if (res.status >= 200 && res.status < 300) return res.json();
  throw res;
}
