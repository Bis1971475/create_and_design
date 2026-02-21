import { TestBed } from '@angular/core/testing';

import { ProductService } from './product';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return products', () => {
    expect(service.getProducts().length).toBeGreaterThan(0);
  });

  it('should return one product by id', () => {
    const product = service.getProductById('1');
    expect(product?.id).toBe('1');
  });
});
