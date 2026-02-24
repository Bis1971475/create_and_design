import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrderService, PaymentMethod } from '../../services/order';
import { environment } from '../../../environments/environment';

type DeliveryMode = 'domicilio' | 'sucursal';

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
  isSubmitting = false;
  createdOrderId = '';

  customerName = '';
  phone = '';
  deliveryDate = '';
  address = '';
  notes = '';
  deliveryMode: DeliveryMode = 'domicilio';

  paymentMethod: PaymentMethod = 'efectivo';
  cashChangeFor = '';
  transferReference = '';
  readonly transferClabe = environment.transferClabe.trim();
  readonly deliveryFeeForHome = 50;

  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);

  readonly items = this.cartService.items;
  readonly totalPrice = this.cartService.totalPrice;

  readonly minDeliveryDate = this.getMinDeliveryDate();

  get normalizedPhone(): string {
    return this.phone.replace(/[^\d+]/g, '').trim();
  }

  get isPhoneValid(): boolean {
    const phoneDigitsOnly = this.phone.replace(/\D/g, '');
    return phoneDigitsOnly.length >= 10 && phoneDigitsOnly.length <= 15;
  }

  get isAddressDetailed(): boolean {
    const trimmedAddress = this.address.trim();
    if (!trimmedAddress) {
      return false;
    }

    const hasStreetNumber = /\d/.test(trimmedAddress);
    return trimmedAddress.length >= 12 && hasStreetNumber;
  }

  get deliveryFee(): number {
    return this.deliveryMode === 'domicilio' ? this.deliveryFeeForHome : 0;
  }

  get totalWithDelivery(): number {
    return this.totalPrice() + this.deliveryFee;
  }

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
      !this.isPhoneValid ||
      !this.deliveryDate ||
      !this.isDateValid
    ) {
      return false;
    }

    if (this.deliveryMode === 'domicilio' && !this.isAddressDetailed) {
      return false;
    }

    if (this.paymentMethod === 'transferencia') {
      return this.transferReference.trim().length > 3;
    }

    return true;
  }

  async placeOrder(): Promise<void> {
    this.errorMessage = '';

    if (this.items().length === 0) {
      this.errorMessage = 'No hay productos en el carrito.';
      return;
    }

    if (!this.isFormValid) {
      this.errorMessage = 'Completa los datos del pedido y selecciona una fecha valida (minimo 3 dias).';
      return;
    }

    this.isSubmitting = true;

    try {
      const response = await this.orderService.createOrder({
        customer: {
          name: this.customerName.trim(),
          phone: this.normalizedPhone,
        },
        delivery: {
          date: this.deliveryDate,
          address: this.deliveryMode === 'domicilio' ? this.address.trim() : 'Recoger en sucursal',
          notes: this.notes.trim(),
        },
        payment: {
          method: this.paymentMethod,
          details: this.getPaymentDetails(),
        },
        total: this.totalWithDelivery,
        items: this.orderService.buildItemsFromCart(this.items()),
      });

      this.createdOrderId = response.orderId;
      this.cartService.clear();
      this.orderPlaced = true;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'API_BASE_URL_NOT_CONFIGURED') {
        this.errorMessage = 'Falta configurar la URL del API de pedidos.';
      } else {
        this.errorMessage = 'No se pudo registrar el pedido. Intentalo de nuevo en un momento.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private getPaymentDetails(): {
    cashChangeFor?: string;
    transferReference?: string;
    transferClabe?: string;
  } {
    if (this.paymentMethod === 'efectivo') {
      return this.cashChangeFor.trim() ? { cashChangeFor: this.cashChangeFor.trim() } : {};
    }

    if (this.paymentMethod === 'transferencia') {
      const transferDetails: { transferReference: string; transferClabe?: string } = {
        transferReference: this.transferReference.trim(),
      };
      if (this.transferClabe) {
        transferDetails.transferClabe = this.transferClabe;
      }
      return transferDetails;
    }

    return {};
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
