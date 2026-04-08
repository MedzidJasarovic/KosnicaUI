import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YieldService, CreateYieldPayload } from '../../../services/yield.service';
import { NotificationService } from '../../../services/notification.service';

interface ProductOption {
  id: number;
  label: string;
  icon: string;
}

interface YieldRow {
  productType: number | null;
  quantity: number | null;
}

const PRODUCT_OPTS: ProductOption[] = [
  { id: 0, label: 'Med', icon: 'assets/products/honey.png' },
  { id: 1, label: 'Wax', icon: 'assets/products/wax.png' },
  { id: 2, label: 'Propolis', icon: 'assets/products/propolis.png' },
  { id: 3, label: 'Pollen', icon: 'assets/products/pollen.png' },
  { id: 4, label: 'RoyalJelly', icon: 'assets/products/royal-jelly.png' }
];

@Component({
  selector: 'app-yield-logging-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './yield-logging-modal.component.html',
  styleUrl: './yield-logging-modal.component.scss'
})
export class YieldLoggingModalComponent implements OnInit {
  @Input() hiveId!: number;
  @Input() apiaryId!: number;
  @Input() hiveIdentifier!: string;
  @Input() harvestDate!: string; // From the completed intervention
  
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  rows: YieldRow[] = [];
  notes: string = '';
  isSubmitting = false;

  allProducts = PRODUCT_OPTS;

  constructor(
      private yieldService: YieldService,
      private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Start with 1 empty row
    this.rows.push({ productType: null, quantity: null });
  }

  getAvailableProducts(currentRowIndex: number): ProductOption[] {
    const selectedTypesInOtherRows = this.rows
      .filter((r, i) => i !== currentRowIndex && r.productType !== null)
      .map(r => Number(r.productType));
      
    return this.allProducts.filter(p => !selectedTypesInOtherRows.includes(p.id));
  }
  
  get canAddNewRow(): boolean {
      if (this.rows.length === 0) return true;
      const lastRow = this.rows[this.rows.length - 1];
      return lastRow.productType !== null && lastRow.quantity !== null && lastRow.quantity > 0;
  }
  
  get canSubmit(): boolean {
      const validRows = this.rows.filter(r => r.productType !== null && r.quantity !== null && r.quantity > 0);
      return validRows.length > 0;
  }

  addRow(): void {
      if (this.canAddNewRow) {
          this.rows.push({ productType: null, quantity: null });
      }
  }

  removeRow(index: number): void {
      this.rows.splice(index, 1);
      if (this.rows.length === 0) {
          this.addRow();
      }
  }
  
  getProductIcon(typeId: any): string {
      const p = this.allProducts.find(x => x.id == typeId);
      return p ? p.icon : '❓';
  }

  saveYields(): void {
    if (!this.canSubmit) return;
    
    this.isSubmitting = true;

    // Filter valid rows and map to payloads
    const payloads: CreateYieldPayload[] = this.rows
        .filter(r => r.productType !== null && r.quantity !== null && r.quantity > 0)
        .map(r => ({
            hiveId: this.hiveId,
            apiaryId: this.apiaryId,
            date: this.harvestDate,
            productType: Number(r.productType),
            quantity: Number(r.quantity),
            notes: this.notes
        }));

    this.yieldService.createBulkYields(payloads).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.saved.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status !== 403) this.notificationService.notify('Došlo je do greške prilikom evidentiranja prinosa.');
      }
    });
  }
}

