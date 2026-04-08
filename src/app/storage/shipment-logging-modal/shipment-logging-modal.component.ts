import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShipmentService, CreateShipmentPayload } from '../../services/shipment.service';

interface ProductOption {
  id: number;
  label: string;
  icon: string;
}

interface ShipmentRow {
  productType: number | null;
  quantity: number | null;
}

const PRODUCT_OPTS: ProductOption[] = [
  { id: 0, label: 'Med', icon: 'assets/products/honey.png' },
  { id: 1, label: 'Vosak', icon: 'assets/products/wax.png' },
  { id: 2, label: 'Propolis', icon: 'assets/products/propolis.png' },
  { id: 3, label: 'Polen', icon: 'assets/products/pollen.png' },
  { id: 4, label: 'Matična mliječ', icon: 'assets/products/royal-jelly.png' }
];

@Component({
  selector: 'app-shipment-logging-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipment-logging-modal.component.html',
  styleUrl: './shipment-logging-modal.component.scss'
})
export class ShipmentLoggingModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  rows: ShipmentRow[] = [];
  receiverName: string = '';
  description: string = '';
  isSubmitting = false;
  errorMessage: string | null = null;

  allProducts = PRODUCT_OPTS;

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit(): void {
    this.rows.push({ productType: null, quantity: null });
  }

  get canAddNewRow(): boolean {
      const lastRow = this.rows[this.rows.length - 1];
      // Can add if last row is valid AND we haven't selected all products yet
      const allSelected = this.rows.length >= this.allProducts.length;
      return !allSelected && lastRow.productType !== null && lastRow.quantity !== null && lastRow.quantity > 0;
  }
  
  get canSubmit(): boolean {
      const validRows = this.rows.filter(r => r.productType !== null && r.quantity !== null && r.quantity > 0);
      return validRows.length > 0 && this.receiverName.trim().length > 0;
  }

  isProductAvailable(productTypeId: number, currentRowIndex: number): boolean {
      return !this.rows.some((row, i) => i !== currentRowIndex && Number(row.productType) === productTypeId);
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
      return p ? p.icon : '🔍';
  }

  saveShipments(): void {
    if (!this.canSubmit) return;
    
    this.isSubmitting = true;

    const items = this.rows
        .filter(r => r.productType !== null && r.quantity !== null && r.quantity > 0)
        .map(r => ({
            productType: Number(r.productType),
            quantity: Number(r.quantity)
        }));

    const payload: CreateShipmentPayload = {
        receiverName: this.receiverName,
        description: this.description,
        date: new Date().toISOString(),
        items: items
    };

    this.shipmentService.createBulkShipments(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.saved.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 400 && typeof err.error === 'string') {
            this.errorMessage = err.error;
        } else {
            this.errorMessage = 'Nemate dovoljno proizvoda na stanju.';
        }
      }
    });
  }
}

