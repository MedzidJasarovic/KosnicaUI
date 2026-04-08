import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Intervention {
    id: number;
    hiveId?: number;
    apiaryId?: number;
    type: number;
    description?: string;
    plannedDate: string;
    executionDate?: string;
    status: number; // 0 = Planned, 1 = Completed, 2 = Canceled
    apiaryName?: string;
    hiveIdentifier?: string;
}

export interface CreateInterventionPayload {
    hiveId?: number;
    apiaryId?: number;
    type: number;
    description?: string;
    plannedDate: string;
    status: number;
}

@Injectable({
    providedIn: 'root'
})
export class InterventionService {
    private apiUrl = 'https://kosnicaapi.onrender.com/api/interventions';

    constructor(private http: HttpClient) { }

    getInterventions(apiaryId?: number, hiveId?: number): Observable<Intervention[]> {
        let params = new HttpParams();
        if (apiaryId != null) params = params.set('apiaryId', apiaryId.toString());
        if (hiveId != null) params = params.set('hiveId', hiveId.toString());

        return this.http.get<Intervention[]>(this.apiUrl, { params });
    }

    createIntervention(payload: CreateInterventionPayload): Observable<Intervention> {
        return this.http.post<Intervention>(this.apiUrl, payload);
    }

    createBulkApiaryInterventions(apiaryId: number, payload: CreateInterventionPayload): Observable<Intervention[]> {
        return this.http.post<Intervention[]>(`${this.apiUrl}/bulk-apiary/${apiaryId}`, payload);
    }

    completeIntervention(id: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/complete`, {});
    }

    updateStatus(id: number, status: number): Observable<Intervention> {
        return this.http.put<Intervention>(`${this.apiUrl}/${id}/status`, status, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    updatePlannedDate(id: number, date: string): Observable<Intervention> {
        return this.http.patch<Intervention>(`${this.apiUrl}/${id}/date`, { plannedDate: date });
    }

    deleteIntervention(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
