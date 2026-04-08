import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface YieldRecord {
    id: number;
    hiveId?: number;
    apiaryId?: number;
    date: string;
    productType: number | string;
    quantity: number;
    notes?: string;
    weatherConditions?: string;
}

export interface CreateYieldPayload {
    hiveId?: number;
    apiaryId?: number;
    date: string;
    productType: number | string;
    quantity: number;
    notes?: string;
    weatherConditions?: string;
}

export interface YieldStatistics {
    productType: number | string;
    totalQuantity: number;
}

@Injectable({
    providedIn: 'root'
})
export class YieldService {
    private apiUrl = 'https://kosnicaapi.onrender.com/api/yields';

    constructor(private http: HttpClient) { }

    getYields(apiaryId?: number, hiveId?: number, productType?: number): Observable<YieldRecord[]> {
        let params = new HttpParams();
        if (apiaryId != null) params = params.set('apiaryId', apiaryId.toString());
        if (hiveId != null) params = params.set('hiveId', hiveId.toString());
        if (productType != null) params = params.set('productType', productType.toString());

        return this.http.get<YieldRecord[]>(this.apiUrl, { params });
    }

    getStatistics(apiaryId?: number, hiveId?: number): Observable<YieldStatistics[]> {
        let params = new HttpParams();
        if (apiaryId != null) params = params.set('apiaryId', apiaryId.toString());
        if (hiveId != null) params = params.set('hiveId', hiveId.toString());

        return this.http.get<YieldStatistics[]>(`${this.apiUrl}/statistics`, { params });
    }

    createYield(payload: CreateYieldPayload): Observable<YieldRecord> {
        return this.http.post<YieldRecord>(this.apiUrl, payload);
    }

    createBulkYields(payloads: CreateYieldPayload[]): Observable<YieldRecord[]> {
        return this.http.post<YieldRecord[]>(`${this.apiUrl}/bulk`, payloads);
    }

    deleteYield(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
