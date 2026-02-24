import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { CartItem } from './cart';
import { environment } from '../../environments/environment';

export type PaymentMethod = 'efectivo' | 'transferencia';

export interface CreateOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  customer: {
    name: string;
    phone: string;
  };
  delivery: {
    date: string;
    time: string;
    address: string;
    notes: string;
  };
  payment: {
    method: PaymentMethod;
    details: {
      cashChangeFor?: string;
      transferReference?: string;
    };
  };
  total: number;
  items: CreateOrderItem[];
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  async createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
    if (!this.apiBaseUrl) {
      throw new Error('API_BASE_URL_NOT_CONFIGURED');
    }

    const endpoint = `${this.apiBaseUrl}/orders`;
    return firstValueFrom(
      this.http.post<CreateOrderResponse>(endpoint, payload).pipe(timeout(15000))
    );
  }

  buildItemsFromCart(items: CartItem[]): CreateOrderItem[] {
    return items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));
  }
}
