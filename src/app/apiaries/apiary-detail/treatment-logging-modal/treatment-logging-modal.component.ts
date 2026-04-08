import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreatmentService, CreateTreatmentPayload } from '../../../services/treatment.service';

@Component({
  selector: 'app-treatment-logging-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay anim-fade-in" (click)="close()">
      <div class="modal-content glass-card anim-bounce-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>💊 Evidencija tretmana</h2>
          <p>Dodajte detalje o primenjenom leku za košnicu <strong>{{ hiveIdentifier }}</strong></p>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Substanca / Lek *</label>
            <input type="text" [(ngModel)]="substanceName" class="form-input" placeholder="npr. Apiguard, Amivar...">
          </div>

          <div class="form-group">
            <label>Doza</label>
            <input type="text" [(ngModel)]="dose" class="form-input" placeholder="npr. 50g, 1 traka...">
          </div>

          <div class="form-group">
            <label>Reakcija pčela</label>
            <textarea [(ngModel)]="beeReaction" class="form-input" rows="2" placeholder="Kako su pčele reagovale?"></textarea>
          </div>

          <div class="form-group">
            <label>Gubici (ako ih ima)</label>
            <input type="text" [(ngModel)]="losses" class="form-input" placeholder="Opis eventualnih gubitaka">
          </div>
          
          <div class="form-group">
            <label>Datum primene</label>
            <input type="text" [value]="treatmentDate | date:'dd.MM.yyyy'" readonly class="form-input readonly">
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" (click)="close()">Odustani</button>
          <button class="btn-primary" [disabled]="!substanceName || loading" (click)="save()">
            {{ loading ? 'Sakupljanje...' : 'Sačuvaj zapis' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-content {
      background: white; padding: 30px; border-radius: 24px; width: 90%; max-width: 450px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    h2 { margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #212121; }
    p { color: #666; margin-bottom: 24px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
    .form-input {
      width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #eee;
      font-size: 15px; transition: all 0.2s;
      &:focus { border-color: #f59e0b; outline: none; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1); }
    }
    .readonly { background: #f9f9f9; cursor: not-allowed; }
    .modal-footer { display: flex; gap: 12px; margin-top: 24px; }
    .btn-primary, .btn-secondary {
      flex: 1; padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary { 
      background: #212121; color: white; border: none;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    }
    .btn-secondary { background: #f3f4f6; color: #4b5563; border: none; &:hover { background: #e5e7eb; } }
  `]
})
export class TreatmentLoggingModalComponent {
  @Input() hiveId!: number;
  @Input() interventionId?: number;
  @Input() hiveIdentifier!: string;
  @Input() treatmentDate!: string;
  
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  substanceName = '';
  dose = '';
  beeReaction = '';
  losses = '';
  loading = false;

  constructor(private treatmentService: TreatmentService) {}

  close() { this.closed.emit(); }

  save() {
    this.loading = true;
    const payload: CreateTreatmentPayload = {
      hiveId: this.hiveId,
      interventionId: this.interventionId,
      dateApplied: new Date(this.treatmentDate).toISOString(),
      substanceName: this.substanceName,
      dose: this.dose,
      beeReaction: this.beeReaction,
      losses: this.losses
    };

    this.treatmentService.createTreatment(payload).subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: () => this.loading = false
    });
  }
}
