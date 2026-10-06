import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeeHealthService, BeeHealthCheck, BeeHealthLabel, BEE_HEALTH_LABELS } from '../../../services/bee-health.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

/**
 * Tab "Zdravlje pčela" u modalu košnice: korisnik učita fotografiju, backend je
 * prosledi ML modelu, a rezultat se čuva u istoriji pregleda te košnice.
 */
@Component({
  selector: 'app-hive-health-check',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent],
  templateUrl: './hive-health-check.component.html',
  styleUrl: './hive-health-check.component.scss'
})
export class HiveHealthCheckComponent implements OnInit, OnDestroy {
  @Input() hiveId!: number;

  readonly labels = BEE_HEALTH_LABELS;

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isAnalyzing = false;
  latest: BeeHealthCheck | null = null;

  history: BeeHealthCheck[] = [];
  loadingHistory = true;

  showDeleteConfirm = false;
  idToDelete: number | null = null;

  constructor(
    public beeHealthService: BeeHealthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }

  loadHistory() {
    this.loadingHistory = true;
    this.beeHealthService.getHistory(this.hiveId).subscribe({
      next: (data) => {
        this.history = data;
        this.loadingHistory = false;
      },
      error: (err) => {
        this.loadingHistory = false;
        if (err.status !== 403) this.notificationService.notify('Greška pri dobavljanju istorije pregleda.');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.clearPreview();
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.latest = null;
  }

  analyze() {
    if (!this.selectedFile) return;
    this.isAnalyzing = true;

    this.beeHealthService.analyze(this.hiveId, this.selectedFile).subscribe({
      next: (result) => {
        this.isAnalyzing = false;
        this.latest = result;
        this.history = [result, ...this.history];
        this.selectedFile = null;
        this.clearPreview();
      },
      error: (err) => {
        this.isAnalyzing = false;
        if (err.status === 403) return;
        const message = typeof err.error === 'string' && err.error
          ? err.error
          : 'Greška pri analizi fotografije.';
        this.notificationService.notify(message);
      }
    });
  }

  cancelSelection() {
    this.selectedFile = null;
    this.clearPreview();
  }

  deleteCheck(id: number) {
    this.idToDelete = id;
    this.showDeleteConfirm = true;
  }

  onConfirmDelete() {
    const id = this.idToDelete;
    this.showDeleteConfirm = false;
    this.idToDelete = null;
    if (id == null) return;

    this.beeHealthService.delete(this.hiveId, id).subscribe({
      next: () => {
        this.history = this.history.filter(c => c.id !== id);
        if (this.latest?.id === id) this.latest = null;
      },
      error: (err) => { if (err.status !== 403) this.notificationService.notify('Nije moguće obrisati pregled.'); }
    });
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
    this.idToDelete = null;
  }

  // Klase u redosledu kojim ih je vratio model — rade i stari zapisi sa 3 klase.
  probabilityLabels(check: BeeHealthCheck): BeeHealthLabel[] {
    return Object.keys(check.probabilities) as BeeHealthLabel[];
  }

  labelName(label: string): string {
    return this.labels[label as BeeHealthLabel] ?? label;
  }

  percent(value: number | undefined): string {
    value = value ?? 0;
    return (value * 100).toFixed(1) + '%';
  }

  private clearPreview() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }
}
