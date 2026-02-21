import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';

type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  orderPlaced = false;
  errorMessage = '';

  customerName = '';
  phone = '';
  deliveryDate = '';
  deliveryTime = '';
  address = '';
  notes = '';

  paymentMethod: PaymentMethod = 'efectivo';
  cashChangeFor = '';
  transferReference = '';
  cardHolder = '';
  cardLast4 = '';

  private readonly cartService = inject(CartService);

  readonly items = this.cartService.items;
  readonly totalPrice = this.cartService.totalPrice;

  readonly minDeliveryDate = this.getMinDeliveryDate();

  get isDateValid(): boolean {
    if (!this.deliveryDate) {
      return false;
    }

    return this.deliveryDate >= this.minDeliveryDate;
  }

  get isFormValid(): boolean {
    if (
      !this.customerName.trim() ||
      !this.phone.trim() ||
      !this.deliveryDate ||
      !this.deliveryTime ||
      !this.address.trim() ||
      !this.isDateValid
    ) {
      return false;
    }

    if (this.paymentMethod === 'transferencia') {
      return this.transferReference.trim().length > 3;
    }

    if (this.paymentMethod === 'tarjeta') {
      const last4Valid = /^\d{4}$/.test(this.cardLast4.trim());
      return this.cardHolder.trim().length > 2 && last4Valid;
    }

    return true;
  }

  placeOrder(): void {
    this.errorMessage = '';

    if (this.items().length === 0) {
      this.errorMessage = 'No hay productos en el carrito.';
      return;
    }

    if (!this.isFormValid) {
      this.errorMessage = 'Completa los datos del pedido y selecciona una fecha valida (minimo 3 dias).';
      return;
    }

    this.cartService.clear();
    this.orderPlaced = true;
  }

  private getMinDeliveryDate(): string {
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + 3);

    const year = minDate.getFullYear();
    const month = String(minDate.getMonth() + 1).padStart(2, '0');
    const day = String(minDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
