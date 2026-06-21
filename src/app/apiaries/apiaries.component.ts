import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import * as L from 'leaflet';
import { ApiaryService, Apiary } from '../services/apiary.service';
import { NotificationService } from '../services/notification.service';
import { CreateApiaryModalComponent } from './create-apiary-modal/create-apiary-modal.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { ConfirmModalComponent } from '../shared/components/confirm-modal/confirm-modal.component';
import { HiveService, Hive } from '../services/hive.service';
import { InterventionService, Intervention } from '../services/intervention.service';
import { YieldService } from '../services/yield.service';
import { TreatmentService } from '../services/treatment.service';
import { forkJoin } from 'rxjs';

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
    private allHivesMap: { [apiaryId: number]: Hive[] } = {};
    private allInterventions: Intervention[] = [];

    constructor(
        private apiaryService: ApiaryService,
        private notificationService: NotificationService,
        private hiveService: HiveService,
        private interventionService: InterventionService,
        private yieldService: YieldService,
        private treatmentService: TreatmentService,
        private router: Router
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
            next: (apiaries) => {
                this.apiaries = apiaries;
                
                if (apiaries.length === 0) {
                    this.loading = false;
                    return;
                }
                
                const hivesRequests = apiaries.map(a => this.hiveService.getHives(a.id));
                
                forkJoin({
                    hivesList: forkJoin(hivesRequests),
                    interventions: this.interventionService.getInterventions(),
                    yields: this.yieldService.getYields(),
                    treatments: this.treatmentService.getTreatments()
                }).subscribe({
                    next: (res) => {
                        apiaries.forEach((a, index) => {
                            this.allHivesMap[a.id] = res.hivesList[index];
                        });
                        this.allInterventions = res.interventions;
                        this.loading = false;
                        setTimeout(() => this.initMap(res.yields, res.treatments), 100);
                    },
                    error: () => {
                        this.loading = false;
                    }
                });
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    private initMap(yields: any[] = [], treatments: any[] = []): void {
        const mapContainer = document.getElementById('apiaries-overview-map');
        if (!mapContainer) return;

        if (this.map) {
            this.map.remove();
        }

        this.map = L.map('apiaries-overview-map').setView([44.3, 17.8], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        if (this.apiaries.length > 0) {
            const markerGroup = L.featureGroup();
            this.apiaries.forEach(a => {
                const apiaryHives = this.allHivesMap[a.id] || [];
                const apiaryInterventions = this.allInterventions.filter(i => 
                    i.apiaryId === a.id || (i.hiveId != null && apiaryHives.some(h => h.id === i.hiveId))
                );

                const plannedTasks = apiaryInterventions.filter(i => 
                    String(i.status) === '0' || String(i.status) === 'Planned'
                );

                // Compute backlog tasks (Neregistrovani prinos / Neregistrovani tretman)
                const apiaryYields = yields.filter(y => y.apiaryId === a.id || (y.hiveId != null && apiaryHives.some(h => h.id === y.hiveId)));
                const apiaryTreatments = treatments.filter(t => t.hiveId != null && apiaryHives.some(h => h.id === t.hiveId));

                const missingHarvests: { hiveId: number, hiveIdentifier: string, harvestDate: string }[] = [];
                const completedHarvests = apiaryInterventions.filter(i => 
                    (String(i.type) === '3' || String(i.type) === 'Harvest') && 
                    (String(i.status) === '1' || String(i.status) === 'Completed') &&
                    i.hiveId != null
                );
                for (const harvest of completedHarvests) {
                    const hDate = new Date(harvest.plannedDate);
                    const harvestDateStr = hDate.toISOString().split('T')[0];
                    
                    const hasYield = apiaryYields.some(y => {
                        const yDate = new Date(y.date);
                        return y.hiveId === harvest.hiveId && 
                               hDate.getFullYear() === yDate.getFullYear() &&
                               hDate.getMonth() === yDate.getMonth() &&
                               hDate.getDate() === yDate.getDate();
                    });

                    if (!hasYield) {
                        const hive = apiaryHives.find(h => h.id === harvest.hiveId);
                        if (hive) {
                            missingHarvests.push({
                                hiveId: hive.id,
                                hiveIdentifier: hive.identifier,
                                harvestDate: harvestDateStr
                            });
                        }
                    }
                }

                const missingTreatments: { hiveId: number, hiveIdentifier: string, treatmentDate: string, interventionId: number }[] = [];
                const completedTreatments = apiaryInterventions.filter(i => 
                    (String(i.type) === '4' || String(i.type) === 'Treatment') && 
                    (String(i.status) === '1' || String(i.status) === 'Completed') &&
                    i.hiveId != null
                );
                for (const treatment of completedTreatments) {
                    const tDate = new Date(treatment.plannedDate);
                    const treatmentDateStr = tDate.toISOString().split('T')[0];
                    
                    const hasRecord = apiaryTreatments.some(tr => {
                        const trDate = new Date(tr.dateApplied);
                        return (tr.interventionId === treatment.id) || 
                               (tr.hiveId === treatment.hiveId && 
                                tDate.getFullYear() === trDate.getFullYear() &&
                                tDate.getMonth() === trDate.getMonth() &&
                                tDate.getDate() === trDate.getDate());
                    });

                    if (!hasRecord) {
                        const hive = apiaryHives.find(h => h.id === treatment.hiveId);
                        if (hive) {
                            missingTreatments.push({
                                hiveId: hive.id,
                                hiveIdentifier: hive.identifier,
                                treatmentDate: treatmentDateStr,
                                interventionId: treatment.id
                            });
                        }
                    }
                }

                const recommendedTasks: { hiveIdentifier: string, label: string }[] = [];
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                apiaryHives.forEach(h => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const hasRecentFeeding = apiaryInterventions.some(i => {
                        const isFeeding = String(i.type) === '2' || String(i.type) === 'Feeding';
                        const isRecent = new Date(i.plannedDate) >= thirtyDaysAgo;
                        const isCompleted = String(i.status) === '1' || String(i.status) === 'Completed';
                        return i.hiveId === h.id && isFeeding && isRecent && isCompleted;
                    });
                    if (!hasRecentFeeding) {
                        recommendedTasks.push({ hiveIdentifier: h.identifier, label: 'Prihrana' });
                    }

                    if (currentMonth >= 2 && currentMonth <= 3) {
                        const hasSpringInsp = apiaryInterventions.some(i => {
                            const isSpring = String(i.type) === '0' || String(i.type) === 'SpringInspection';
                            const isCurrentYear = new Date(i.plannedDate).getFullYear() === currentYear;
                            const isCompleted = String(i.status) === '1' || String(i.status) === 'Completed';
                            return i.hiveId === h.id && isSpring && isCurrentYear && isCompleted;
                        });
                        if (!hasSpringInsp) {
                            recommendedTasks.push({ hiveIdentifier: h.identifier, label: 'Prolećni pregled' });
                        }
                    }

                    if (currentMonth >= 10 && currentMonth <= 11) {
                        const hasWintering = apiaryInterventions.some(i => {
                            const isWinter = String(i.type) === '1' || String(i.type) === 'Wintering';
                            const isCurrentYear = new Date(i.plannedDate).getFullYear() === currentYear;
                            const isCompleted = String(i.status) === '1' || String(i.status) === 'Completed';
                            return i.hiveId === h.id && isWinter && isCurrentYear && isCompleted;
                        });
                        if (!hasWintering) {
                            recommendedTasks.push({ hiveIdentifier: h.identifier, label: 'Uzimljavanje' });
                        }
                    }
                });

                const totalBacklog = missingHarvests.length + missingTreatments.length;

                let statusClass = 'status-blue';
                let statusText = 'Sve ažurno';
                if (plannedTasks.length > 0 || totalBacklog > 0) {
                    statusClass = 'status-red';
                    statusText = 'Zadaci';
                } else if (recommendedTasks.length > 0) {
                    statusClass = 'status-yellow';
                    statusText = 'Preporučeno';
                }

                const customIcon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `
                        <div class="custom-map-pin ${statusClass}">
                            <div class="pin-head">
                                <span class="pin-symbol">🐝</span>
                            </div>
                            <div class="pin-pulse"></div>
                        </div>
                    `,
                    iconSize: [34, 42],
                    iconAnchor: [17, 42],
                    popupAnchor: [0, -42],
                    tooltipAnchor: [17, -25]
                });

                let plannedListHtml = '';
                if (plannedTasks.length > 0) {
                    const sortedPlanned = [...plannedTasks].sort((x, y) => 
                        new Date(x.plannedDate).getTime() - new Date(y.plannedDate).getTime()
                    );
                    plannedListHtml = `
                        <div class="tooltip-section planned">
                            <div class="section-title">📅 Planirano (${plannedTasks.length})</div>
                            <ul class="task-list">
                                ${sortedPlanned.slice(0, 2).map(i => {
                                    const dateStr = new Date(i.plannedDate).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' });
                                    const hiveStr = i.hiveIdentifier ? ` (Košnica ${i.hiveIdentifier})` : '';
                                    return `<li><strong>${this.getInterventionTypeName(i.type)}</strong> - ${dateStr}${hiveStr}</li>`;
                                }).join('')}
                                ${sortedPlanned.length > 2 ? `<li class="more-items">+ još ${sortedPlanned.length - 2} zadataka</li>` : ''}
                            </ul>
                        </div>
                    `;
                }

                let backlogListHtml = '';
                if (totalBacklog > 0) {
                    const backlogItems: string[] = [];
                    missingHarvests.forEach(h => backlogItems.push(`Neregistrovan prinos (Košnica ${h.hiveIdentifier})`));
                    missingTreatments.forEach(t => backlogItems.push(`Neregistrovan tretman (Košnica ${t.hiveIdentifier})`));

                    backlogListHtml = `
                        <div class="tooltip-section backlog">
                            <div class="section-title">⚠️ Zaostalo (${totalBacklog})</div>
                            <ul class="task-list">
                                ${backlogItems.slice(0, 2).map(item => `<li><strong>${item}</strong></li>`).join('')}
                                ${backlogItems.length > 2 ? `<li class="more-items">+ još ${backlogItems.length - 2} poslova</li>` : ''}
                            </ul>
                        </div>
                    `;
                }

                let recommendedListHtml = '';
                if (recommendedTasks.length > 0) {
                    recommendedListHtml = `
                        <div class="tooltip-section recommended">
                            <div class="section-title">💡 Preporučeno (${recommendedTasks.length})</div>
                            <ul class="task-list">
                                ${recommendedTasks.slice(0, 2).map(r => `
                                    <li><strong>${r.label}</strong> - Košnica ${r.hiveIdentifier}</li>
                                `).join('')}
                                ${recommendedTasks.length > 2 ? `<li class="more-items">+ još ${recommendedTasks.length - 2} preporuka</li>` : ''}
                            </ul>
                        </div>
                    `;
                }

                const noTasksHtml = (plannedTasks.length === 0 && totalBacklog === 0 && recommendedTasks.length === 0) ? `
                    <div class="tooltip-empty">
                        <span>✨ Sve je u najboljem redu!</span>
                    </div>
                ` : '';

                const tooltipHtml = `
                    <div class="apiary-tooltip-card">
                        <div class="tooltip-header">
                            <span class="apiary-name">${a.name}</span>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="tooltip-body">
                            ${plannedListHtml}
                            ${backlogListHtml}
                            ${recommendedListHtml}
                            ${noTasksHtml}
                        </div>
                    </div>
                `;

                const marker = L.marker([a.latitude, a.longitude], { icon: customIcon })
                    .bindTooltip(tooltipHtml, {
                        direction: 'top',
                        className: 'apiary-map-tooltip',
                        offset: [0, -10],
                        sticky: false
                    })
                    .addTo(markerGroup);

                marker.on('click', () => {
                    this.router.navigate(['/apiaries', a.id]);
                });
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
}
