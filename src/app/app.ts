import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type MethodId = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';

interface PaymentMethod {
  id: MethodId;
  label: string;
  hint: string;
}

interface OrderLine {
  name: string;
  meta: string;
  qty: number;
  price: number;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // ---- Order ledger ------------------------------------------------------
  protected readonly orderId = '#PG-88213';
  protected readonly lines: OrderLine[] = [
    { name: 'Aurora Noise-Cancelling Headphones', meta: 'Slate Grey', qty: 1, price: 4999 },
    { name: 'Braided USB-C Cable, 2m', meta: 'Pack of 2', qty: 2, price: 299 },
    { name: 'Express Handling', meta: 'Ships in 24h', qty: 1, price: 149 },
  ];

  protected readonly subtotal = computed(() =>
    this.lines.reduce((sum, l) => sum + l.qty * l.price, 0),
  );
  protected readonly shipping = 0;
  protected readonly tax = computed(() => Math.round(this.subtotal() * 0.18));
  protected readonly total = computed(() => this.subtotal() + this.shipping + this.tax());

  // ---- Payment methods ----------------------------------------------------
  protected readonly methods: PaymentMethod[] = [
    { id: 'card', label: 'Card', hint: 'Credit or debit' },
    { id: 'upi', label: 'UPI', hint: 'Pay by ID or QR' },
    { id: 'netbanking', label: 'Net Banking', hint: 'All major banks' },
    { id: 'wallet', label: 'Wallet', hint: 'Linked balance' },
    { id: 'cod', label: 'Cash on Delivery', hint: 'Pay at the door' },
  ];

  protected readonly selected = signal<MethodId>('card');

  protected readonly banks = [
    'State Trust Bank', 'Harborline National', 'Meridian Cooperative',
    'Northfield Savings', 'Union Crest Bank', 'Coastal Public Bank',
  ];

  protected readonly wallets = [
    'PayNow Wallet', 'QuickCash Wallet', 'OrbitPay Wallet', 'Sundial Wallet',
  ];

  // ---- Card form state ------------------------------------------------
  protected cardNumber = '';
  protected cardName = '';
  protected cardExpiry = '';
  protected cardCvv = '';
  protected saveCard = false;

  // ---- UPI form state ---------------------------------------------------
  protected upiId = '';
  protected readonly qrCells = Array.from({ length: 64 }, (_, i) => i);

  // ---- Net banking state -------------------------------------------------
  protected selectedBank = '';

  // ---- Wallet state -------------------------------------------------------
  protected selectedWallet = '';
  protected walletMobile = '';

  // ---- Cash on delivery ---------------------------------------------------
  protected confirmAddress = false;

  // ---- Flow state -----------------------------------------------------
  protected readonly processing = signal(false);
  protected readonly approved = signal(false);
  protected readonly approvedAt = signal('');

  protected select(id: MethodId) {
    if (this.processing() || this.approved()) return;
    this.selected.set(id);
  }

  protected onCardNumberInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber = digits.replace(/(.{4})/g, '$1 ').trim();
  }

  protected onExpiryInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    this.cardExpiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  protected readonly canAuthorize = computed(() => {
    switch (this.selected()) {
      case 'card':
        return (
          this.cardNumber.replace(/\s/g, '').length === 16 &&
          this.cardName.trim().length > 1 &&
          /^\d{2}\/\d{2}$/.test(this.cardExpiry) &&
          this.cardCvv.length >= 3
        );
      case 'upi':
        return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(this.upiId);
      case 'netbanking':
        return !!this.selectedBank;
      case 'wallet':
        return !!this.selectedWallet && this.walletMobile.replace(/\D/g, '').length === 10;
      case 'cod':
        return this.confirmAddress;
      default:
        return false;
    }
  });

  protected currency(value: number): string {
    return '₹' + value.toLocaleString('en-IN');
  }

  protected authorize() {
    if (!this.canAuthorize() || this.processing()) return;
    this.processing.set(true);
    window.setTimeout(() => {
      this.processing.set(false);
      this.approved.set(true);
      this.approvedAt.set(
        new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    }, 1400);
  }

  protected startNewOrder() {
    this.approved.set(false);
    this.processing.set(false);
  }
}
