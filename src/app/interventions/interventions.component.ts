import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { ApiaryService, Apiary } from '../services/apiary.service';
import { HiveService, Hive } from '../services/hive.service';
import { InterventionService, Intervention } from '../services/intervention.service';
import { RecordsService, TreatmentRecord, YieldRecord } from '../services/records.service';

type Tab = 'interventions' | 'yields' | 'treatments';

@Component({
  selector: 'app-interventions',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './interventions.component.html',
  styleUrl: './interventions.component.scss'
})
export class InterventionsComponent implements OnInit {
  activeTab: Tab = 'interventions';

  // Filter state
  apiaries: Apiary[] = [];
  hives: Hive[] = [];
  selectedApiaryId: number | null = null;
  selectedHiveId: number | null = null;
  selectedInterventionType: string = 'all';
  selectedProductType: string = 'all';

  // Data
  interventions: Intervention[] = [];
  treatments: TreatmentRecord[] = [];
  yields: YieldRecord[] = [];

  loading = false;
  selectedItem: any = null;
  showDetail = false;

  interventionTypes = [
    { value: 'all', label: 'Sve intervencije' },
    { value: 'SpringInspection', label: 'Prolećni pregled' },
    { value: 'Wintering', label: 'Uzimljavanje' },
    { value: 'Feeding', label: 'Prihranjivanje' },
    { value: 'Harvest', label: 'Vrcanje' },
    { value: 'Treatment', label: 'Tretman Lekovima' },
    { value: 'Other', label: 'Ostalo' },
  ];

  productTypes = [
    { value: 'all', label: 'Svi proizvodi' },
    { value: 'Honey', label: 'Med' },
    { value: 'Wax', label: 'Vosak' },
    { value: 'Propolis', label: 'Propolis' },
    { value: 'Pollen', label: 'Polen' },
    { value: 'RoyalJelly', label: 'Matična mliječ' },
    { value: 'Other', label: 'Ostalo' },
  ];

  interventionStatuses = ['Planirano', 'Završeno', 'Otkazano'];

  constructor(
    private apiaryService: ApiaryService,
    private hiveService: HiveService,
    private interventionService: InterventionService,
    private recordsService: RecordsService
  ) {}

  ngOnInit() {
    this.apiaryService.getApiaries().subscribe(data => {
      this.apiaries = data;
      this.load();
    });
  }

  setTab(tab: Tab) {
    this.activeTab = tab;
    this.load();
  }

  onApiaryChange() {
    this.selectedHiveId = null;
    this.hives = [];
    if (this.selectedApiaryId) {
      this.hiveService.getHives(this.selectedApiaryId).subscribe(data => {
        this.hives = data;
      });
    }
    this.load();
  }

  onHiveChange() {
    this.load();
  }

  load() {
    this.loading = true;
    const apiaryId = this.selectedApiaryId ?? undefined;
    const hiveId = this.selectedHiveId ?? undefined;

    if (this.activeTab === 'interventions') {
      this.interventionService.getInterventions(apiaryId, hiveId).subscribe({
        next: data => {
          let filtered = data;
          if (this.selectedInterventionType !== 'all') {
            filtered = data.filter(i => String(i.type) === this.selectedInterventionType);
          }
          this.interventions = filtered.sort((a, b) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else if (this.activeTab === 'yields') {
      const pt = this.selectedProductType !== 'all' ? this.selectedProductType : undefined;
      this.recordsService.getYields(apiaryId, hiveId, pt).subscribe({
        next: data => {
          this.yields = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      this.recordsService.getTreatments(apiaryId, hiveId).subscribe({
        next: data => {
          this.treatments = data.sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  getInterventionTypeName(type: any): string {
    const t = String(type);
    if (t === '0' || t === 'SpringInspection') return 'Prolećni pregled';
    if (t === '1' || t === 'Wintering') return 'Uzimljavanje';
    if (t === '2' || t === 'Feeding') return 'Prihranjivanje';
    if (t === '3' || t === 'Harvest') return 'Vrcanje';
    if (t === '4' || t === 'Treatment') return 'Tretman Lekovima';
    if (t === '5' || t === 'Other') return 'Ostalo';
    return 'Intervencija';
  }

  getInterventionStatusName(status: any): string {
    const s = String(status);
    if (s === '0' || s === 'Planned') return 'Planirano';
    if (s === '1' || s === 'Completed') return 'Završeno';
    if (s === '2' || s === 'Canceled') return 'Otkazano';
    return s;
  }

  getStatusClass(status: any): string {
    const s = String(status);
    if (s === '0' || s === 'Planned') return 'status-planned';
    if (s === '1' || s === 'Completed') return 'status-done';
    if (s === '2' || s === 'Canceled') return 'status-canceled';
    return '';
  }

  getProductTypeName(type: any): string {
    const t = String(type);
    if (t === '0' || t === 'Honey') return 'Med';
    if (t === '1' || t === 'Wax') return 'Vosak';
    if (t === '2' || t === 'Propolis') return 'Propolis';
    if (t === '3' || t === 'Pollen') return 'Polen';
    if (t === '4' || t === 'RoyalJelly') return 'Matična mliječ';
    if (t === '5' || t === 'Other') return 'Ostalo';
    return t;
  }

  openDetail(item: any) {
    this.selectedItem = item;
    this.showDetail = true;
  }
}
