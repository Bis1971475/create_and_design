import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Product } from '../models/product';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { LOCAL_PRODUCTS } from '../data/local-products';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  private readonly cacheKey = 'products_cache_v1';
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private productsCache: Product[] | null = null;
  private cacheExpiresAt = 0;
  private inFlightRequest: Promise<Product[]> | null = null;

  async getProducts(): Promise<Product[]> {
    if (LOCAL_PRODUCTS.length > 0) {
      return this.cloneProducts(LOCAL_PRODUCTS);
    }

    const now = Date.now();

    if (this.productsCache && now < this.cacheExpiresAt) {
      return this.productsCache;
    }

    const storageCache = this.getStorageCache();
    if (storageCache && now < storageCache.expiresAt) {
      this.productsCache = storageCache.products;
      this.cacheExpiresAt = storageCache.expiresAt;
      return storageCache.products;
    }

    if (this.inFlightRequest) {
      return this.inFlightRequest;
    }

    if (!this.apiBaseUrl) {
      throw new Error('API_BASE_URL_NOT_CONFIGURED');
    }

    this.inFlightRequest = this.fetchProducts();
    return this.inFlightRequest;
  }

  async getProductById(productId: string): Promise<Product | undefined> {
    const products = await this.getProducts();
    return products.find((p) => p.id === productId);
  }

  private async fetchProducts(): Promise<Product[]> {
    try {
      const endpoint = `${this.apiBaseUrl}/products`;
      const products = await firstValueFrom(this.http.get<Product[]>(endpoint).pipe(timeout(15000)));
      const normalizedProducts = products ?? [];
      const expiresAt = Date.now() + this.cacheTtlMs;

      this.productsCache = normalizedProducts;
      this.cacheExpiresAt = expiresAt;
      this.setStorageCache(normalizedProducts, expiresAt);

      return normalizedProducts;
    } finally {
      this.inFlightRequest = null;
    }
  }

  private getStorageCache(): { products: Product[]; expiresAt: number } | null {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as { products?: Product[]; expiresAt?: number };
      if (!Array.isArray(parsed.products) || typeof parsed.expiresAt !== 'number') {
        return null;
      }

      return {
        products: parsed.products,
        expiresAt: parsed.expiresAt,
      };
    } catch {
      return null;
    }
  }

  private setStorageCache(products: Product[], expiresAt: number): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({ products, expiresAt }));
    } catch {
      // Ignore storage quota or privacy mode errors.
    }
  }

  private cloneProducts(products: Product[]): Product[] {
    return products.map((product) => ({
      ...product,
      imageUrls: [...product.imageUrls],
      colors: product.colors ? [...product.colors] : undefined,
    }));
  }
}
