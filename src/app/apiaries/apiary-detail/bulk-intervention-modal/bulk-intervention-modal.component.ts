import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterventionService, CreateInterventionPayload } from '../../../services/intervention.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-bulk-intervention-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-intervention-modal.component.html',
  styleUrl: './bulk-intervention-modal.component.scss'
})
export class BulkInterventionModalComponent {
  @Input() apiaryId!: number;
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  // Form State
  intType = 0;
  intDescription = '';
  intPlannedDate = new Date().toISOString().substring(0, 10);
  intStatus = 0; // Default to Planned

  isSubmitting = false;

  constructor(
      private interventionService: InterventionService,
      private notificationService: NotificationService
  ) {}

  addBulkIntervention() {
    if (!this.intPlannedDate) return;
    
    this.isSubmitting = true;
    
    const payload: CreateInterventionPayload = {
      type: Number(this.intType),
      description: this.intDescription,
      plannedDate: new Date(this.intPlannedDate).toISOString(),
      status: Number(this.intStatus)
    };

    this.interventionService.createBulkApiaryInterventions(this.apiaryId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.created.emit(); // Triggers refresh of apiary interventions
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status !== 403) this.notificationService.notify('Greška pri dodavanju grupne intervencije.');
      }
    });
  }
}
