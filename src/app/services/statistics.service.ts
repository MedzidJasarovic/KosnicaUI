import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
    totalApiaries: number;
    totalHives: number;
    upcomingInterventions: number;
}

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private apiUrl = 'https://kosnicaapi.onrender.com/api/statistics';

    constructor(private http: HttpClient) { }

    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
    }
}
