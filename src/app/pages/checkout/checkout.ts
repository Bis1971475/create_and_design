import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  orderPlaced = false;
  private readonly cartService = inject(CartService);

  readonly items = this.cartService.items;
  readonly totalPrice = this.cartService.totalPrice;

  placeOrder(): void {
    if (this.items().length === 0) {
      return;
    }

    this.cartService.clear();
    this.orderPlaced = true;
  }

}
