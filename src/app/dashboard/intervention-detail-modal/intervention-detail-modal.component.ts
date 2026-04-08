import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterventionService, Intervention } from '../../services/intervention.service';

@Component({
  selector: 'app-intervention-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intervention-detail-modal.component.html',
  styleUrl: './intervention-detail-modal.component.scss'
})
export class InterventionDetailModalComponent {
  @Input() intervention!: Intervention;
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  loading = false;
  editMode = false;
  
  // For editing
  editedDescription: string = '';
  editedDate: string = '';

  constructor(private interventionService: InterventionService) {}

  ngOnInit() {
    this.editedDescription = this.intervention.description || '';
    this.editedDate = this.intervention.plannedDate.split('T')[0];
  }

  getInterventionTypeName(type: any): string {
    const t = String(type);
    if (t === '0' || t === 'SpringInspection') return 'Prolećni pregled';
    if (t === '1' || t === 'Wintering') return 'Uzimljavanje';
    if (t === '2' || t === 'Feeding') return 'Prihranjivanje';
    if (t === '3' || t === 'Harvest') return 'Vrcanje';
    if (t === '4' || t === 'Treatment') return 'Tretman Lekovima';
    if (t === '5' || t === 'Other') return 'Ostalo';
    return 'Akcija';
  }

  completeTask() {
    this.loading = true;
    this.interventionService.completeIntervention(this.intervention.id).subscribe({
      next: () => {
        this.loading = false;
        this.updated.emit();
        this.closed.emit();
      },
      error: () => this.loading = false
    });
  }

  delayTask() {
    if (!this.editedDate) return;
    this.loading = true;
    this.interventionService.updatePlannedDate(this.intervention.id, this.editedDate).subscribe({
      next: () => {
        this.loading = false;
        this.editMode = false;
        this.updated.emit();
        this.closed.emit();
      },
      error: () => this.loading = false
    });
  }

  cancelTask() {
    if (confirm('Da li ste sigurni da želite da otkažete ovaj zadatak?')) {
      this.loading = true;
      this.interventionService.updateStatus(this.intervention.id, 2).subscribe({
        next: () => {
          this.loading = false;
          this.updated.emit();
          this.closed.emit();
        },
        error: () => this.loading = false
      });
    }
  }
}
