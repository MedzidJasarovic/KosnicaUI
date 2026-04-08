import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YieldService } from '../services/yield.service';
import { ShipmentService, ShipmentRecord } from '../services/shipment.service';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { ShipmentLoggingModalComponent } from './shipment-logging-modal/shipment-logging-modal.component';
import { ShipmentDetailsModalComponent } from './shipment-details-modal/shipment-details-modal.component';

@Component({
  selector: 'app-storage',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarComponent, 
    ShipmentLoggingModalComponent,
    ShipmentDetailsModalComponent
  ],
  templateUrl: './storage.component.html',
  styleUrl: './storage.component.scss'
})
export class StorageComponent implements OnInit {
  statistics: any[] = [];
  shipments: ShipmentRecord[] = [];
  viewMode: 'all' | 'current' = 'current';
  loading = true;
  loadingHistory = true;
  showShipmentModal = false;
  selectedShipment: ShipmentRecord | null = null;
  showDetailsModal = false;

  constructor(
    private yieldService: YieldService,
    private shipmentService: ShipmentService
  ) {}

  ngOnInit() {
    this.loadStatistics();
    this.loadHistory();
  }

  loadStatistics() {
    this.loading = true;
    this.viewMode === 'all'
      ? this.yieldService.getStatistics().subscribe({
          next: (stats) => {
            this.statistics = stats || [];
            this.loading = false;
          },
          error: () => (this.loading = false),
        })
      : this.shipmentService.getStatistics('current').subscribe({
          next: (stats) => {
            this.statistics = stats || [];
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
  }

  loadHistory() {
    this.loadingHistory = true;
    this.shipmentService.getShipments().subscribe({
      next: (data) => {
        this.shipments = data || [];
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
        this.shipments = [];
      }
    });
  }

  setViewMode(mode: 'all' | 'current') {
    this.viewMode = mode;
    this.loadStatistics();
  }

  onShipmentSaved() {
    this.showShipmentModal = false;
    this.loadStatistics();
    this.loadHistory();
  }

  openDetails(shipment: ShipmentRecord) {
    this.selectedShipment = shipment;
    this.showDetailsModal = true;
  }

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
        return { label: 'Propolis', icon: 'assets/products/propolis.png', unit: 'kg' };
      case '3':
      case 'Pollen':
        return { label: 'Polen', icon: 'assets/products/pollen.png', unit: 'kg' };
      case '4':
      case 'RoyalJelly':
        return { label: 'Matična mliječ', icon: 'assets/products/royal-jelly.png', unit: 'g' };
      default:
        return { label: 'Ostalo', icon: 'assets/products/honey.png', unit: 'kg/kom' };
    }
  }
}
