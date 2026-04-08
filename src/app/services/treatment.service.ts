import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TreatmentRecord {
    id: number;
    hiveId: number;
    interventionId?: number;
    dateApplied: string;
    substanceName: string;
    dose?: string;
    beeReaction?: string;
    losses?: string;
    // Enriched by frontend if needed
    apiaryName?: string;
    hiveIdentifier?: string;
}

export interface CreateTreatmentPayload {
    hiveId: number;
    interventionId?: number;
    dateApplied: string;
    substanceName: string;
    dose?: string;
    beeReaction?: string;
    losses?: string;
}

@Injectable({ providedIn: 'root' })
export class TreatmentService {
    private apiUrl = 'http://localhost:5264/api/treatments';

    constructor(private http: HttpClient) {}

    getTreatments(apiaryId?: number, hiveId?: number): Observable<TreatmentRecord[]> {
        let params = new HttpParams();
        if (apiaryId != null) params = params.set('apiaryId', apiaryId.toString());
        if (hiveId != null) params = params.set('hiveId', hiveId.toString());
        return this.http.get<TreatmentRecord[]>(this.apiUrl, { params });
    }

    createTreatment(payload: CreateTreatmentPayload): Observable<TreatmentRecord> {
        return this.http.post<TreatmentRecord>(this.apiUrl, payload);
    }

    deleteTreatment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
