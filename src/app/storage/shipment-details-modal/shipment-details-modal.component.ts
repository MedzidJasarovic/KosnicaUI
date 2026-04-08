import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipmentRecord } from '../../services/shipment.service';

@Component({
  selector: 'app-shipment-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shipment-details-modal.component.html',
  styleUrl: './shipment-details-modal.component.scss'
})
export class ShipmentDetailsModalComponent {
  @Input() shipment: ShipmentRecord | null = null;
  @Output() closed = new EventEmitter<void>();

  getDisplayData(productType: any) {
    const type = String(productType);
    switch (type) {
      case '0':
      case 'Honey':
        return { label: 'Med', icon: 'assets/products/honey.png', unit: 'kg' };
      case '1':
      case 'Wax':
        return { label: 'Vosak', icon: 'assets/products/wax.png', unit: 'kg' };
      case '2':
      case 'Propolis':
        return { label: 'Propolis', icon: 'assets/products/propolis.png', unit: 'kom' };
      case '3':
      case 'Pollen':
        return { label: 'Polen', icon: 'assets/products/pollen.png', unit: 'kg' };
      case '4':
      case 'RoyalJelly':
        return { label: 'Matična mliječ', icon: 'assets/products/royal-jelly.png', unit: 'kom' };
      default:
        return { label: 'Ostalo', icon: 'assets/products/honey.png', unit: 'kg/kom' };
    }
  }
}
