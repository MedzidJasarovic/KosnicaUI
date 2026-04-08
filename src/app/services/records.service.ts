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
    // Enriched by frontend
    apiaryName?: string;
    hiveIdentifier?: string;
}

export interface YieldRecord {
    id: number;
    hiveId?: number;
    apiaryId?: number;
    date: string;
    productType: string | number;
    quantity: number;
    notes?: string;
    weatherConditions?: string;
    // Enriched
    apiaryName?: string;
    hiveIdentifier?: string;
}

@Injectable({ providedIn: 'root' })
export class RecordsService {
    private treatmentsUrl = 'https://kosnicaapi.onrender.com/api/treatments';
    private yieldsUrl = 'https://kosnicaapi.onrender.com/api/yields';

    constructor(private http: HttpClient) { }

    getTreatments(apiaryId?: number, hiveId?: number): Observable<TreatmentRecord[]> {
        let params = new HttpParams();
        if (apiaryId != null) params = params.set('apiaryId', apiaryId.toString());
        if (hiveId != null) params = params.set('hiveId', hiveId.toString());
        return this.http.get<TreatmentRecord[]>(this.treatmentsUrl, { params });
    }

    getYields(apiaryId?: number, hiveId?: number, productType?: string | number): Observable<YieldRecord[]> {
        let params = new HttpParams();
        if (apiaryId != null) params = params.set('apiaryId', apiaryId.toString());
        if (hiveId != null) params = params.set('hiveId', hiveId.toString());
        if (productType != null) params = params.set('productType', productType.toString());
        return this.http.get<YieldRecord[]>(this.yieldsUrl, { params });
    }
}
