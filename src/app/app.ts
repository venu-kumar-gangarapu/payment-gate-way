import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Route, Router } from '@angular/router';

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  // ---- Order ledger ------------------------------------------------------
  protected readonly lines: OrderLine[] = [
    { name: 'Aurora Noise-Cancelling Headphones', meta: 'Slate Grey', qty: 1, price: 4999 }
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
  protected cardNumber = signal('');
  protected cardName = signal('');
  protected cardExpiry = signal('');
  protected cardCvv = signal('');
  protected saveCard = signal('');

  protected upiId = signal('');
  protected selectedBank = signal('');
  protected selectedWallet = signal('');
  protected walletMobile = signal('');
  protected confirmAddress = signal(false);

  // ---- Flow state -----------------------------------------------------
  protected readonly processing = signal(false);
  protected readonly approved = signal(false);
  protected readonly approvedAt = signal('');
 
  readonly orderId = signal('');
  readonly amount = signal('');
  ngOnInit (){
      this.route.queryParams.subscribe((params :any)=>{
        console.log(params);
        this.orderId.set(params?.orderId);
        this.amount.set(params?.amount);
      })
  }
  protected select(id: MethodId) {
    if (this.processing() || this.approved()) return;
    this.selected.set(id);
  }

  protected onCardNumberInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber.set(digits.replace(/(.{4})/g, '$1 ').trim());
  }

  protected onExpiryInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    this.cardExpiry.set(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  }

  
  protected readonly canAuthorize = computed(() => {
    switch (this.selected()) {
      case 'card':
        
        console.log(this.cardNumber().replace(/\s/g, '').length === 16,'cardnumebr');
        console.log(this.cardName().trim().length > 1,'name');
        console.log( this.cardCvv.length >= 3,'cvv');
        
        
        return (
          this.cardNumber().replace(/\s/g, '').length === 16 &&
          this.cardName().trim().length > 1 &&
          /^\d{2}\/\d{2}$/.test(this.cardExpiry()) &&
          this.cardCvv().length >= 3
        );
      case 'upi':
        return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(this.upiId());
      case 'netbanking':
        return !!this.selectedBank;
      case 'wallet':
        return !!this.selectedWallet && this.walletMobile().replace(/\D/g, '').length === 10;
      case 'cod':
        return this.confirmAddress;
      default:
        
        return false;
    }
  });

  protected currency(value: string): string {
    return '₹' + Number(value).toLocaleString('en-IN');
  }

  protected authorize() {
    if (!this.canAuthorize()) return;
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
      window.location.href =
      `https://react-apps-eight-steel.vercel.app/orders?payment=success&orderId=${this.orderId()}&paymentId=909`;
  }
}
