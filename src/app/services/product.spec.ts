import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ProductService } from './product';
import { environment } from '../../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return products from api', async () => {
    const productsPromise = service.getProducts();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        id: '1',
        name: 'Ramo de Rosas con Fresas',
        description: 'Ramo de 24 rosas con 6 fresas decoradas',
        price: 650,
        imageUrls: ['https://example.com/flower.jpg'],
        category: 'Rosas',
        stock: 10,
      },
    ]);

    const products = await productsPromise;
    expect(products.length).toBe(1);
    expect(products[0].id).toBe('1');
  });

  it('should return one product by id from api', async () => {
    const productPromise = service.getProductById('1');

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        id: '1',
        name: 'Ramo de Rosas con Fresas',
        description: 'Ramo de 24 rosas con 6 fresas decoradas',
        price: 650,
        imageUrls: ['https://example.com/flower.jpg'],
        category: 'Rosas',
        stock: 10,
      },
    ]);

    const product = await productPromise;
    expect(product?.id).toBe('1');
  });
});
