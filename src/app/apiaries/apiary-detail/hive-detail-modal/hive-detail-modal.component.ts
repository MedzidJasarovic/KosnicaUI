import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HiveService, Hive, CreateHivePayload } from '../../../services/hive.service';
import { InterventionService, Intervention, CreateInterventionPayload } from '../../../services/intervention.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-hive-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './hive-detail-modal.component.html',
  styleUrl: './hive-detail-modal.component.scss'
})
export class HiveDetailModalComponent implements OnInit {
  @Input() apiaryId!: number;
  @Input() hive!: Hive;
  @Output() closed = new EventEmitter<void>();
  @Output() updatedOrDeleted = new EventEmitter<void>();

  activeTab: 'details' | 'interventions' = 'details';

  // Hive Edit state
  editMode = false;
  editIdentifier = '';
  editType = '';
  editSupers = 1;
  editQueenStatus = '';
  editStrength = '';
  isUpdating = false;
  showDeleteHiveConfirm = false;

  // Interventions state
  interventions: Intervention[] = [];
  loadingInterventions = true;
  showAddIntervention = false;
  statusFilter = 'all';
  showDeleteIntvConfirm = false;
  intvIdToDelete: number | null = null;

  // New Intervention Form
  intType = 0;
  intDescription = '';
  intPlannedDate = new Date().toISOString().substring(0, 10);
  intStatus = 1; // Completed default
  isSubmittingIntervention = false;

  constructor(
    private hiveService: HiveService,
    private interventionService: InterventionService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.resetEditForm();
    this.loadInterventions();
  }

  // -- EDIT HIVE LOGIC --
  resetEditForm() {
    this.editIdentifier = this.hive.identifier;
    this.editType = this.hive.type;
    this.editSupers = this.hive.numberOfSupers;
    this.editQueenStatus = this.hive.queenStatus;
    this.editStrength = this.hive.colonyStrength;
    this.editMode = false;
  }

  saveHive() {
    if (!this.editIdentifier.trim() || this.editSupers < 1 || this.editSupers > 3) return;

    this.isUpdating = true;
    const payload: CreateHivePayload = {
      identifier: this.editIdentifier,
      type: this.editType,
      positionX: this.hive.positionX,
      positionY: this.hive.positionY,
      numberOfSupers: this.editSupers,
      queenStatus: this.editQueenStatus,
      colonyStrength: this.editStrength
    };

    this.hiveService.updateHive(this.apiaryId, this.hive.id, payload).subscribe({
      next: () => {
        this.isUpdating = false;
        this.updatedOrDeleted.emit();
      },
      error: (err) => {
        this.isUpdating = false;
        if (err.status !== 403) this.notificationService.notify('Greška pri ažuriranju košnice.');
      }
    });
  }

  deleteHive() {
    this.showDeleteHiveConfirm = true;
  }

  onConfirmDeleteHive() {
    this.showDeleteHiveConfirm = false;
    this.hiveService.deleteHive(this.apiaryId, this.hive.id).subscribe({
      next: () => this.updatedOrDeleted.emit(),
      error: (err) => { if (err.status !== 403) this.notificationService.notify('Greška pri brisanju košnice.'); }
    });
  }

  // -- INTERVENTIONS LOGIC --
  loadInterventions() {
    this.loadingInterventions = true;
    this.interventionService.getInterventions(undefined, this.hive.id).subscribe({
      next: (data: Intervention[]) => {
        this.interventions = data.sort((a: Intervention, b: Intervention) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());
        this.loadingInterventions = false;
      },
      error: (err) => {
        this.loadingInterventions = false;
        if (err.status !== 403) this.notificationService.notify('Greška pri dobavljanju intervencija.');
      }
    });
  }

  get filteredInterventions(): Intervention[] {
    if (this.statusFilter === 'all') return this.interventions;
    return this.interventions.filter(i => {
      const status = String(i.status); // handle string or number
      if (this.statusFilter === 'Planned') return status === '0' || status === 'Planned';
      if (this.statusFilter === 'Completed') return status === '1' || status === 'Completed';
      if (this.statusFilter === 'Skipped') return status === '2' || status === 'Skipped';
      return true;
    });
  }

  markAsCompleted(id: number) {
    this.interventionService.updateStatus(id, 1).subscribe({
      next: () => {
        this.loadInterventions();
        this.updatedOrDeleted.emit();
      },
      error: (err) => { if (err.status !== 403) this.notificationService.notify('Greška pri ažuriranju statusa.'); }
    });
  }

  markAsSkipped(id: number) {
    this.interventionService.updateStatus(id, 2).subscribe({
      next: () => this.loadInterventions(),
      error: (err) => { if (err.status !== 403) this.notificationService.notify('Greška pri ažuriranju statusa.'); }
    });
  }

  addIntervention() {
    if (!this.intPlannedDate) return;
    this.isSubmittingIntervention = true;
    const payload: CreateInterventionPayload = {
      hiveId: this.hive.id,
      type: Number(this.intType),
      description: this.intDescription,
      plannedDate: new Date(this.intPlannedDate).toISOString(),
      status: Number(this.intStatus)
    };

    this.interventionService.createIntervention(payload).subscribe({
      next: () => {
        this.isSubmittingIntervention = false;
        this.showAddIntervention = false;
        this.intDescription = '';
        this.loadInterventions();
        this.updatedOrDeleted.emit();
      },
      error: (err) => {
        this.isSubmittingIntervention = false;
        if (err.status !== 403) this.notificationService.notify('Greška pri dodavanju intervencije.');
      }
    });
  }

  deleteIntervention(id: number) {
    this.intvIdToDelete = id;
    this.showDeleteIntvConfirm = true;
  }

  onConfirmDeleteIntv() {
    if (this.intvIdToDelete) {
      this.interventionService.deleteIntervention(this.intvIdToDelete).subscribe({
        next: () => {
          this.showDeleteIntvConfirm = false;
          this.intvIdToDelete = null;
          this.loadInterventions();
          this.updatedOrDeleted.emit();
        },
        error: (err) => {
          this.showDeleteIntvConfirm = false;
          this.intvIdToDelete = null;
          if (err.status !== 403) this.notificationService.notify('Nije moguće izbrisati intervenciju.');
        }
      });
    }
  }

  onCancelDelete() {
    this.showDeleteHiveConfirm = false;
    this.showDeleteIntvConfirm = false;
    this.intvIdToDelete = null;
  }

  getInterventionTypeName(type: any): string {
    const t = String(type);
    if (t === '0' || t === 'SpringInspection') return 'Prolećni pregled';
    if (t === '1' || t === 'Wintering') return 'Uzimljavanje';
    if (t === '2' || t === 'Feeding') return 'Prihranjivanje';
    if (t === '3' || t === 'Harvest') return 'Vrcanje (Harvest)';
    if (t === '4' || t === 'Treatment') return 'Tretman Lijekovima';
    if (t === '5' || t === 'Other') return 'Ostalo';
    return 'Nepoznato';
  }

  getStatusName(status: any): string {
    const s = String(status);
    if (s === '0' || s === 'Planned') return 'Planirano';
    if (s === '1' || s === 'Completed') return 'Završeno';
    if (s === '2' || s === 'Skipped') return 'Preskočeno';
    return '';
  }

  isStatus(intvStatus: any, checkStatus: 'Planned' | 'Completed' | 'Skipped'): boolean {
    const s = String(intvStatus);
    if (checkStatus === 'Planned') return s === '0' || s === 'Planned';
    if (checkStatus === 'Completed') return s === '1' || s === 'Completed';
    if (checkStatus === 'Skipped') return s === '2' || s === 'Skipped';
    return false;
  }
}
