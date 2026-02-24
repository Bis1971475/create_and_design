import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart';
import { NotificationService } from '../../services/notification';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrls: ['./products.css'],
  templateUrl: './products.html',
})
export class ProductsComponent implements OnInit {
  private readonly firstLoadSessionKey = 'catalog_loaded_once';

  lightboxVisible = false;
  lightboxImage = '';
  products: Product[] = [];
  isInitialLoading = false;

  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.isInitialLoading = !sessionStorage.getItem(this.firstLoadSessionKey);
    void this.loadProducts();
  }

  private async loadProducts(): Promise<void> {
    try {
      this.products = await this.productService.getProducts();
      this.products.forEach((p) => (p.selectedImageIndex = 0));
      sessionStorage.setItem(this.firstLoadSessionKey, '1');
    } finally {
      this.isInitialLoading = false;
      this.cdr.detectChanges();
    }
  }

  prevImage(product: Product): void {
    if (!product.imageUrls) {
      return;
    }

    const currentIndex = product.selectedImageIndex ?? 0;
    product.selectedImageIndex =
      (currentIndex - 1 + product.imageUrls.length) % product.imageUrls.length;
  }

  nextImage(product: Product): void {
    if (!product.imageUrls) {
      return;
    }

    const currentIndex = product.selectedImageIndex ?? 0;
    product.selectedImageIndex = (currentIndex + 1) % product.imageUrls.length;
  }

  openLightbox(imgUrl: string): void {
    this.lightboxImage = imgUrl;
    this.lightboxVisible = true;
  }

  closeLightbox(): void {
    this.lightboxVisible = false;
  }

  addToCart(product: Product): void {
    this.cartService.add(product);
    this.notificationService.success(`${product.name} agregado al carrito`);
  }

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }
}
