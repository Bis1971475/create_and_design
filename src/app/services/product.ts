import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Product } from '../models/product';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  async getProducts(): Promise<Product[]> {
    if (!this.apiBaseUrl) {
      throw new Error('API_BASE_URL_NOT_CONFIGURED');
    }

    const endpoint = `${this.apiBaseUrl}/products`;
    const products = await firstValueFrom(this.http.get<Product[]>(endpoint).pipe(timeout(15000)));

    return products ?? [];
  }

  async getProductById(productId: string): Promise<Product | undefined> {
    const products = await this.getProducts();
    return products.find((p) => p.id === productId);
  }
}
