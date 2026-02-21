import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      return;
    }

    this.product = this.productService.getProductById(productId);
    if (this.product && this.product.selectedImageIndex === undefined) {
      this.product.selectedImageIndex = 0;
    }
  }

  prevImage(): void {
    if (!this.product) {
      return;
    }

    const currentIndex = this.product.selectedImageIndex ?? 0;
    this.product.selectedImageIndex =
      (currentIndex - 1 + this.product.imageUrls.length) % this.product.imageUrls.length;
  }

  nextImage(): void {
    if (!this.product) {
      return;
    }

    const currentIndex = this.product.selectedImageIndex ?? 0;
    this.product.selectedImageIndex = (currentIndex + 1) % this.product.imageUrls.length;
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    this.cartService.add(this.product);
  }
}
