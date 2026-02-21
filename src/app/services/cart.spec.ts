import { TestBed } from '@angular/core/testing';

import { CartService } from './cart';
import { Product } from '../models/product';

describe('CartService', () => {
  let service: CartService;
  const product: Product = {
    id: 'p1',
    name: 'Test',
    description: 'Product test',
    price: 100,
    imageUrls: ['/test.jpg'],
    category: 'Test',
    stock: 5,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add and remove items', () => {
    service.add(product, 2);
    expect(service.totalItems()).toBe(2);
    expect(service.totalPrice()).toBe(200);

    service.remove(product.id);
    expect(service.totalItems()).toBe(0);
  });
});
