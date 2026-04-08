import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { YieldStatistics } from './yield.service';

export interface ShipmentItemRecord {
    id: number;
    productType: number | string;
    quantity: number;
}

export interface ShipmentRecord {
    id: number;
    date: string;
    receiverName: string;
    description?: string;
    items: ShipmentItemRecord[];
}

export interface CreateShipmentItemPayload {
    productType: number | string;
    quantity: number;
}

export interface CreateShipmentPayload {
    receiverName: string;
    description?: string;
    date: string;
    items: CreateShipmentItemPayload[];
}

@Injectable({
    providedIn: 'root'
})
export class ShipmentService {
    private apiUrl = 'http://localhost:5264/api/storage';

    constructor(private http: HttpClient) { }

    getStatistics(viewMode: 'all' | 'current' = 'all'): Observable<YieldStatistics[]> {
        let params = new HttpParams().set('viewMode', viewMode);
        return this.http.get<YieldStatistics[]>(`${this.apiUrl}/statistics`, { params });
    }

    createBulkShipments(payload: CreateShipmentPayload): Observable<ShipmentRecord> {
        return this.http.post<ShipmentRecord>(`${this.apiUrl}/shipments`, payload);
    }

    getShipments(): Observable<ShipmentRecord[]> {
        return this.http.get<ShipmentRecord[]>(`${this.apiUrl}/shipments`);
    }
}

