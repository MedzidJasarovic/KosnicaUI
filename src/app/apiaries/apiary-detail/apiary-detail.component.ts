import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiaryService, Apiary } from '../../services/apiary.service';
import { HiveService, Hive } from '../../services/hive.service';
import { InterventionService, Intervention } from '../../services/intervention.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { CreateHiveModalComponent } from './create-hive-modal/create-hive-modal.component';
import { HiveDetailModalComponent } from './hive-detail-modal/hive-detail-modal.component';
import { BulkInterventionModalComponent } from './bulk-intervention-modal/bulk-intervention-modal.component';
import { YieldService, YieldRecord } from '../../services/yield.service';
import { YieldLoggingModalComponent } from './yield-logging-modal/yield-logging-modal.component';
import { TreatmentService, TreatmentRecord } from '../../services/treatment.service';
import { TreatmentLoggingModalComponent } from './treatment-logging-modal/treatment-logging-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-apiary-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CreateHiveModalComponent, HiveDetailModalComponent, SidebarComponent, BulkInterventionModalComponent, YieldLoggingModalComponent, TreatmentLoggingModalComponent],
    templateUrl: './apiary-detail.component.html',
    styleUrl: './apiary-detail.component.scss'
})
export class ApiaryDetailComponent implements OnInit {
    apiaryId!: number;
    apiary: Apiary | null = null;
    hives: Hive[] = [];
    loading = true;

    // 8x8 Grid
    gridSize = 8;
    gridRows = Array(this.gridSize).fill(0).map((_, i) => i);
    gridCols = Array(this.gridSize).fill(0).map((_, i) => i);

    showCreateHiveModal = false;
    showHiveDetailModal = false;
    showBulkModal = false;
    selectedX: number | null = null;
    selectedY: number | null = null;
    selectedHive: Hive | null = null;

    // Filtering State
    activeFilter: string = 'all';
    apiaryInterventions: Intervention[] = [];

    // Yields State
    apiaryYields: YieldRecord[] = [];
    missingHarvests: { hiveId: number, hiveIdentifier: string, harvestDate: string }[] = [];
    showYieldModal = false;
    yieldModalHiveId!: number;
    yieldModalHiveIdentifier!: string;
    yieldModalHarvestDate!: string;

    // Treatments State
    apiaryTreatments: TreatmentRecord[] = [];
    missingTreatments: { hiveId: number, hiveIdentifier: string, treatmentDate: string, interventionId: number }[] = [];
    showTreatmentModal = false;
    treatmentModalHiveId!: number;
    treatmentModalHiveIdentifier!: string;
    treatmentModalDate!: string;
    treatmentModalInterventionId!: number;

    userRole: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private apiaryService: ApiaryService,
        private hiveService: HiveService,
        private interventionService: InterventionService,
        private yieldService: YieldService,
        private treatmentService: TreatmentService,
        private authService: AuthService
    ) { 
        this.userRole = this.authService.currentUser()?.role || null;
    }

    ngOnInit(): void {
        this.apiaryId = Number(this.route.snapshot.paramMap.get('id'));
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.apiaryService.getApiaries().subscribe((apiaries: Apiary[]) => {
            this.apiary = apiaries.find(a => a.id === this.apiaryId) || null;

            this.hiveService.getHives(this.apiaryId).subscribe({
                next: (hives: Hive[]) => {
                    this.hives = hives;
                    this.loadInterventions(); // cascade load
                },
                error: () => this.loading = false
            });
        });
    }

    loadInterventions(): void {
        this.interventionService.getInterventions(this.apiaryId).subscribe({
            next: (intvs: Intervention[]) => {
                this.apiaryInterventions = intvs;
                this.loadYields();
            },
            error: () => this.loading = false
        });
    }

    loadYields(): void {
        this.yieldService.getYields(this.apiaryId).subscribe({
            next: (yields: YieldRecord[]) => {
                this.apiaryYields = yields;
                this.loadTreatments();
            },
            error: () => this.loading = false
        });
    }

    loadTreatments(): void {
        this.treatmentService.getTreatments(this.apiaryId).subscribe({
            next: (treatments: TreatmentRecord[]) => {
                this.apiaryTreatments = treatments;
                this.calculatePendingTasks();
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    calculatePendingTasks(): void {
        this.calculateMissingHarvests();
        this.calculateMissingTreatments();
    }

    calculateMissingHarvests(): void {
        this.missingHarvests = [];
        if (this.userRole?.toLowerCase() === 'veterinarian') return; // Veterinarian doesn't see yield tasks

        const completedHarvests = this.apiaryInterventions.filter(i => 
            (String(i.type) === '3' || i.type === ('Harvest' as any)) && 
            (String(i.status) === '1' || i.status === ('Completed' as any)) &&
            i.hiveId != null
        );

        for (const harvest of completedHarvests) {
            const hDate = new Date(harvest.plannedDate);
            const harvestDateStr = hDate.toISOString().split('T')[0];
            
            const hasYield = this.apiaryYields.some(y => {
                const yDate = new Date(y.date);
                return y.hiveId === harvest.hiveId && 
                       hDate.getFullYear() === yDate.getFullYear() &&
                       hDate.getMonth() === yDate.getMonth() &&
                       hDate.getDate() === yDate.getDate();
            });

            if (!hasYield) {
                const hive = this.hives.find(h => h.id === harvest.hiveId);
                if (hive) {
                    this.missingHarvests.push({
                        hiveId: hive.id,
                        hiveIdentifier: hive.identifier,
                        harvestDate: harvestDateStr
                    });
                }
            }
        }
    }

    calculateMissingTreatments(): void {
        this.missingTreatments = [];
        if (this.userRole?.toLowerCase() === 'assistant') return; // Assistant doesn't see treatment tasks

        // Treatment is type 4. Status is 1 (Completed)
        const completedTreatments = this.apiaryInterventions.filter(i => 
            (String(i.type) === '4' || i.type === ('Treatment' as any)) && 
            (String(i.status) === '1' || i.status === ('Completed' as any)) &&
            i.hiveId != null
        );

        for (const treatment of completedTreatments) {
            const tDate = new Date(treatment.plannedDate);
            const treatmentDateStr = tDate.toISOString().split('T')[0];
            
            // Check if there is a Treatment record linked to this intervention OR on this day for this hive
            const hasRecord = this.apiaryTreatments.some(tr => {
                const trDate = new Date(tr.dateApplied);
                return (tr.interventionId === treatment.id) || 
                       (tr.hiveId === treatment.hiveId && 
                        tDate.getFullYear() === trDate.getFullYear() &&
                        tDate.getMonth() === trDate.getMonth() &&
                        tDate.getDate() === trDate.getDate());
            });

            if (!hasRecord) {
                const hive = this.hives.find(h => h.id === treatment.hiveId);
                if (hive) {
                    this.missingTreatments.push({
                        hiveId: hive.id,
                        hiveIdentifier: hive.identifier,
                        treatmentDate: treatmentDateStr,
                        interventionId: treatment.id
                    });
                }
            }
        }
    }

    hiveNeedsAttention(hiveId: number): boolean {
        if (this.activeFilter === 'all') return false;

        // Condition for "Completed" status
        const isCompleted = (i: Intervention) => String(i.status) === '1' || String(i.status) === 'Completed';

        // "needsFeeding" condition:
        // True if no COMPLETED 'Prihranjivanje' (Type 2) intervention within the last 30 days
        if (this.activeFilter === 'needsFeeding') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const hasRecentFeeding = this.apiaryInterventions.some(i => {
                const isTypeFeeding = i.type === 2 || i.type === ('Feeding' as any);
                const isRecent = new Date(i.plannedDate) >= thirtyDaysAgo;
                return i.hiveId === hiveId && isTypeFeeding && isRecent && isCompleted(i);
            });

            return !hasRecentFeeding;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed: 0=Jan, 1=Feb, 2=Mar, 3=Apr, 10=Nov, 11=Dec

        if (this.activeFilter === 'needsSpringInspection') {
            // Spring Inspection Period: March (2) and April (3)
            if (currentMonth >= 2 && currentMonth <= 3) {
                const hasSpringInspectionThisYear = this.apiaryInterventions.some(i => {
                    const isSpringInsp = i.type === 0 || i.type === ('SpringInspection' as any);
                    const isCurrentYear = new Date(i.plannedDate).getFullYear() === currentYear;
                    return i.hiveId === hiveId && isSpringInsp && isCurrentYear && isCompleted(i);
                });
                return !hasSpringInspectionThisYear;
            }
            return false; // Not in the period, so don't highlight
        }

        if (this.activeFilter === 'needsWintering') {
            // Wintering Period: November (10) and December (11)
            if (currentMonth >= 10 && currentMonth <= 11) {
                const hasWinteringThisYear = this.apiaryInterventions.some(i => {
                    const isWintering = i.type === 1 || i.type === ('Wintering' as any);
                    const isCurrentYear = new Date(i.plannedDate).getFullYear() === currentYear;
                    return i.hiveId === hiveId && isWintering && isCurrentYear && isCompleted(i);
                });
                return !hasWinteringThisYear;
            }
            return false; // Not in the period, so don't highlight
        }

        return false;
    }

    getHiveAt(x: number, y: number): Hive | undefined {
        return this.hives.find(h => h.positionX === x && h.positionY === y);
    }

    getHiveIcon(type: string): string {
        switch (type) {
            case 'LR': return 'assets/hives/hive-lr.png';
            case 'Farar': return 'assets/hives/hive-farar.png';
            case 'DB':
            case 'Other':
            default: return 'assets/hives/hive-db.png';
        }
    }

    onCellClick(x: number, y: number): void {
        const existingHive = this.getHiveAt(x, y);
        if (!existingHive) {
            this.selectedX = x;
            this.selectedY = y;
            this.showCreateHiveModal = true;
        } else {
            this.selectedHive = existingHive;
            this.showHiveDetailModal = true;
        }
    }

    onHiveCreated(): void {
        this.showCreateHiveModal = false;
        this.loadData();
    }

    onHiveDetailModalClosed(): void {
        this.showHiveDetailModal = false;
        this.selectedHive = null;
    }

    onHiveUpdatedOrDeleted(): void {
        this.showHiveDetailModal = false;
        this.selectedHive = null;
        this.loadData();
    }

    onBulkModalCreated(): void {
        this.showBulkModal = false;
        // Reload interventions to apply new data to filtering
        this.loadInterventions(); 
    }

    openYieldModal(harvest: any): void {
        this.yieldModalHiveId = harvest.hiveId;
        this.yieldModalHiveIdentifier = harvest.hiveIdentifier;
        this.yieldModalHarvestDate = harvest.harvestDate;
        this.showYieldModal = true;
    }

    onYieldModalSaved(): void {
        this.showYieldModal = false;
        this.loadYields();
    }

    openTreatmentModal(task: any): void {
        this.treatmentModalHiveId = task.hiveId;
        this.treatmentModalHiveIdentifier = task.hiveIdentifier;
        this.treatmentModalDate = task.treatmentDate;
        this.treatmentModalInterventionId = task.interventionId;
        this.showTreatmentModal = true;
    }

    onTreatmentModalSaved(): void {
        this.showTreatmentModal = false;
        this.loadTreatments();
    }
}
