import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Hive {
    id: number;
    identifier: string;
    type: string;
    positionX: number;
    positionY: number;
    numberOfSupers: number;
    queenStatus: string;
    colonyStrength: string;
}

export interface CreateHivePayload {
    identifier: string;
    type: string;
    positionX: number;
    positionY: number;
    numberOfSupers: number;
    queenStatus: string;
    colonyStrength: string;
}

@Injectable({
    providedIn: 'root'
})
export class HiveService {
    private apiUrl = 'https://kosnicaapi.onrender.com/api/apiaries';

    constructor(private http: HttpClient) { }

    getHives(apiaryId: number): Observable<Hive[]> {
        return this.http.get<Hive[]>(`${this.apiUrl}/${apiaryId}/hives`);
    }

    createHive(apiaryId: number, payload: CreateHivePayload): Observable<Hive> {
        return this.http.post<Hive>(`${this.apiUrl}/${apiaryId}/hives`, payload);
    }

    updateHive(apiaryId: number, id: number, payload: CreateHivePayload): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${apiaryId}/hives/${id}`, payload);
    }

    deleteHive(apiaryId: number, id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${apiaryId}/hives/${id}`);
    }
}
