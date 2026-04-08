import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StatisticsService, DashboardStats } from '../services/statistics.service';
import { ApiaryService, Apiary } from '../services/apiary.service';
import { InterventionService, Intervention } from '../services/intervention.service';
import { WeatherService, WeatherData } from '../services/weather.service';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { InterventionDetailModalComponent } from './intervention-detail-modal/intervention-detail-modal.component';
import { AddTeamMemberModalComponent } from './add-team-member-modal/add-team-member-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, InterventionDetailModalComponent, AddTeamMemberModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user = this.authService.currentUser;
  stats: DashboardStats | null = null;
  statsLoading = true;

  // Enhancements
  apiaries: Apiary[] = [];
  currentApiaryIndex = 0;
  weather: WeatherData | null = null;
  weatherLoading = false;
  plannedInterventions: Intervention[] = [];
  allPlannedInterventions: Intervention[] = [];
  loadingInterventions = true;
  selectedIntervention: Intervention | null = null;
  showInterventionModal = false;
  showTeamModal = false;

  constructor(
    private authService: AuthService,
    private statisticsService: StatisticsService,
    private apiaryService: ApiaryService,
    private interventionService: InterventionService,
    private weatherService: WeatherService
  ) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadApiaries();
    this.loadPlannedInterventions();
  }

  loadStats() {
    this.statisticsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.statsLoading = false;
      },
      error: () => {
        this.statsLoading = false;
      }
    });
  }

  loadApiaries() {
    this.apiaryService.getApiaries().subscribe({
      next: (data) => {
        this.apiaries = data;
        if (this.apiaries.length > 0) {
          this.loadWeather();
        }
      }
    });
  }

  loadPlannedInterventions() {
    this.loadingInterventions = true;
    this.interventionService.getInterventions().subscribe({
      next: (data) => {
        // Filter only 'Planned' (status 0)
        this.allPlannedInterventions = data.filter(i => String(i.status) === '0' || String(i.status) === 'Planned');
        
        this.plannedInterventions = [...this.allPlannedInterventions]
          .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());
        this.loadingInterventions = false;
      },
      error: () => this.loadingInterventions = false
    });
  }

  openIntervention(intervention: Intervention) {
    this.selectedIntervention = intervention;
    this.showInterventionModal = true;
  }

  onInterventionUpdated() {
    this.loadPlannedInterventions();
    this.loadStats();
  }

  loadWeather() {
    if (!this.apiaries[this.currentApiaryIndex]) return;
    
    this.weatherLoading = true;
    this.weatherService.getWeatherForApiary(this.apiaries[this.currentApiaryIndex].id).subscribe({
      next: (data) => {
        this.weather = data;
        this.weatherLoading = false;
      },
      error: () => {
        this.weather = null;
        this.weatherLoading = false;
      }
    });
  }

  nextApiaryWeather() {
    if (this.apiaries.length <= 1) return;
    this.currentApiaryIndex = (this.currentApiaryIndex + 1) % this.apiaries.length;
    this.loadWeather();
  }

  get currentApiaryName(): string {
    return this.apiaries[this.currentApiaryIndex]?.name || 'Nema pčelinjaka';
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
