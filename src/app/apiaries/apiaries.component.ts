import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { ApiaryService, Apiary } from '../services/apiary.service';
import { NotificationService } from '../services/notification.service';
import { CreateApiaryModalComponent } from './create-apiary-modal/create-apiary-modal.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { ConfirmModalComponent } from '../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-apiaries',
    standalone: true,
    imports: [CommonModule, RouterModule, CreateApiaryModalComponent, SidebarComponent, ConfirmModalComponent],
    templateUrl: './apiaries.component.html',
    styleUrl: './apiaries.component.scss'
})
export class ApiariesComponent implements OnInit, OnDestroy {
    apiaries: Apiary[] = [];
    loading = true;
    showCreateModal = false;
    apiaryToEdit: Apiary | null = null;
    
    // Delete Confirmation
    showDeleteConfirm = false;
    apiaryIdToDelete: number | null = null;

    private map!: L.Map;
    private markers: L.Marker[] = [];

    constructor(
        private apiaryService: ApiaryService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadApiaries();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    loadApiaries(): void {
        this.loading = true;
        this.apiaryService.getApiaries().subscribe({
            next: (data) => {
                this.apiaries = data;
                this.loading = false;
                // Wait for DOM then init/refresh map
                setTimeout(() => this.initMap(), 100);
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    private initMap(): void {
        const mapContainer = document.getElementById('apiaries-overview-map');
        if (!mapContainer) return;

        if (this.map) {
            this.map.remove();
        }

        this.map = L.map('apiaries-overview-map').setView([44.3, 17.8], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        const iconDefault = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        });

        if (this.apiaries.length > 0) {
            const markerGroup = L.featureGroup();
            this.apiaries.forEach(a => {
                const marker = L.marker([a.latitude, a.longitude], { icon: iconDefault })
                    .bindPopup(`<b>${a.name}</b><br>${a.hiveCount} košnica`)
                    .addTo(markerGroup);
            });
            markerGroup.addTo(this.map);
            this.map.fitBounds(markerGroup.getBounds().pad(0.2));
        }
    }

    onModalCreated(): void {
        this.closeModal();
        this.loadApiaries();
    }

    closeModal(): void {
        this.showCreateModal = false;
        this.apiaryToEdit = null;
    }

    openEditModal(e: Event, apiary: Apiary): void {
        e.stopPropagation(); // Prevent routing to grid view
        this.apiaryToEdit = apiary;
        this.showCreateModal = true;
    }

    deleteApiary(e: Event, id: number): void {
        e.stopPropagation(); // Prevent routing to grid view
        this.apiaryIdToDelete = id;
        this.showDeleteConfirm = true;
    }

    onConfirmDelete(): void {
        if (this.apiaryIdToDelete) {
            this.apiaryService.deleteApiary(this.apiaryIdToDelete).subscribe({
                next: () => {
                    this.showDeleteConfirm = false;
                    this.apiaryIdToDelete = null;
                    this.loadApiaries();
                },
                error: (err) => {
                    this.showDeleteConfirm = false;
                    this.apiaryIdToDelete = null;
                    if (err.status !== 403) this.notificationService.notify('Greška pri brisanju pčelinjaka.');
                }
            });
        }
    }

    onCancelDelete(): void {
        this.showDeleteConfirm = false;
        this.apiaryIdToDelete = null;
    }
}
