import { Component, OnInit, AfterViewInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { CreateApiaryPayload, Apiary, ApiaryService } from '../../services/apiary.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-create-apiary-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ConfirmModalComponent],
    templateUrl: './create-apiary-modal.component.html',
    styleUrl: './create-apiary-modal.component.scss'
})
export class CreateApiaryModalComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() existingApiaries: Apiary[] = [];
    @Input() apiaryToEdit: Apiary | null = null;
    @Output() closed = new EventEmitter<void>();
    @Output() created = new EventEmitter<void>();

    name = '';
    lat: number | null = null;
    lng: number | null = null;
    isSubmitting = false;
    error = '';
    showProximityConfirm = false;
    proximityWarningMessage = '';

    private map!: L.Map;
    private marker: L.Marker | null = null;

    constructor(private apiaryService: ApiaryService) { }

    ngOnInit(): void {
        if (this.apiaryToEdit) {
            this.name = this.apiaryToEdit.name;
            this.lat = this.apiaryToEdit.latitude;
            this.lng = this.apiaryToEdit.longitude;
        }
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    private initMap(): void {
        // Fix default marker icon paths for Angular/webpack
        const iconDefault = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        });

        this.map = L.map('apiary-map').setView([44.0, 17.5], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Place existing apiaries as markers
        const iconExisting = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            className: 'marker-existing' // Optional styling
        });

        this.existingApiaries.forEach(a => {
            L.marker([a.latitude, a.longitude], { icon: iconExisting, opacity: 0.6 })
                .bindPopup(`<b>${a.name}</b>`)
                .addTo(this.map);
        });

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            this.lat = parseFloat(e.latlng.lat.toFixed(6));
            this.lng = parseFloat(e.latlng.lng.toFixed(6));

            if (this.marker) {
                this.marker.setLatLng(e.latlng);
            } else {
                this.marker = L.marker(e.latlng, { icon: iconDefault }).addTo(this.map);
            }
        });

        // If editing, add current position marker
        if (this.apiaryToEdit && this.lat !== null && this.lng !== null) {
            this.marker = L.marker([this.lat, this.lng], { icon: iconDefault }).addTo(this.map);
            this.map.setView([this.lat, this.lng], 10);
        }
    }

    get canSubmit(): boolean {
        return this.name.trim().length > 0 && this.lat !== null && this.lng !== null && !this.isSubmitting;
    }

    onSubmit(): void {
        if (!this.canSubmit) return;

        // Check proximity if not editing the SAME one
        const closeApiary = this.existingApiaries.find(a => {
            if (this.apiaryToEdit && a.id === this.apiaryToEdit.id) return false;
            const dist = this.calculateDistance(this.lat!, this.lng!, a.latitude, a.longitude);
            return dist <= 3.0; // 3 kilometers
        });

        if (closeApiary && !this.showProximityConfirm) {
            this.proximityWarningMessage = `Pčelinjak se nalazi u krugu od 3km od pčelinjaka "${closeApiary.name}". Jeste li sigurni da želite da kreirate/sačuvate pčelinjak na ovoj lokaciji?`;
            this.showProximityConfirm = true;
            return;
        }

        this.executeSave();
    }

    executeSave(): void {
        this.isSubmitting = true;
        this.error = '';
        this.showProximityConfirm = false;

        const payload: CreateApiaryPayload = {
            name: this.name.trim(),
            latitude: this.lat!,
            longitude: this.lng!
        };

        if (this.apiaryToEdit) {
            this.apiaryService.updateApiary(this.apiaryToEdit.id, payload).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.created.emit();
                },
                error: () => {
                    this.isSubmitting = false;
                    this.error = 'Greška pri spremanju izmjena.';
                }
            });
        } else {
            this.apiaryService.createApiary(payload).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.created.emit();
                },
                error: () => {
                    this.isSubmitting = false;
                    this.error = 'Greška pri kreiranju pčelinjaka. Pokušajte ponovo.';
                }
            });
        }
    }

    onClose(): void {
        this.closed.emit();
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
