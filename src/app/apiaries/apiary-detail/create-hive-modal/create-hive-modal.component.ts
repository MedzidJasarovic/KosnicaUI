import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HiveService, CreateHivePayload } from '../../../services/hive.service';

@Component({
    selector: 'app-create-hive-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './create-hive-modal.component.html',
    styleUrl: './create-hive-modal.component.scss'
})
export class CreateHiveModalComponent {
    @Input() apiaryId!: number;
    @Input() gridX!: number;
    @Input() gridY!: number;
    @Output() closed = new EventEmitter<void>();
    @Output() created = new EventEmitter<void>();

    identifier = '';
    type = 'LR';
    queenStatus = 'Mlada (2024)';
    colonyStrength = 'Srednje';
    numberOfSupers = 1;

    isSubmitting = false;
    error = '';

    hiveTypes = ['LR', 'DB', 'Farar', 'Other'];
    strengths = ['Slabo', 'Srednje', 'Jako'];

    constructor(private hiveService: HiveService) { }

    onSubmit(): void {
        if (!this.identifier.trim()) return;

        this.isSubmitting = true;
        this.error = '';

        const payload: CreateHivePayload = {
            identifier: this.identifier.trim(),
            type: this.type,
            positionX: this.gridX,
            positionY: this.gridY,
            numberOfSupers: this.numberOfSupers,
            queenStatus: this.queenStatus,
            colonyStrength: this.colonyStrength
        };

        this.hiveService.createHive(this.apiaryId, payload).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.created.emit();
            },
            error: (err) => {
                this.isSubmitting = false;
                this.error = err.error || 'Greška pri kreiranju košnice. Pokušajte ponovo.';
            }
        });
    }

    onClose(): void {
        this.closed.emit();
    }
}
