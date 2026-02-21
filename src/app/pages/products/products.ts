import { Component, OnInit, inject } from '@angular/core';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrls: ['./products.css'] ,
  templateUrl: './products.html'
})
export class ProductsComponent implements OnInit {
  lightboxVisible = false;
  lightboxImage = '';
  products: Product[] = [];

  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  ngOnInit(): void {
    this.products = this.productService.getProducts();
    this.products.forEach(p => (p.selectedImageIndex = 0));

  }
  prevImage(product: Product): void {
    if (!product.imageUrls) return;
    const currentIndex = product.selectedImageIndex ?? 0;
    product.selectedImageIndex =
      (currentIndex - 1 + product.imageUrls.length) %
      product.imageUrls.length;
  }

  nextImage(product: Product): void {
    if (!product.imageUrls) return;
    const currentIndex = product.selectedImageIndex ?? 0;
    product.selectedImageIndex =
      (currentIndex + 1) % product.imageUrls.length;
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
  }

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }
}
