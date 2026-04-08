import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Apiary {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    hiveCount: number;
}

export interface CreateApiaryPayload {
    name: string;
    latitude: number;
    longitude: number;
}

@Injectable({
    providedIn: 'root'
})
export class ApiaryService {
    private apiUrl = 'http://localhost:5264/api/apiaries';

    constructor(private http: HttpClient) { }

    getApiaries(): Observable<Apiary[]> {
        return this.http.get<Apiary[]>(this.apiUrl);
    }

    createApiary(payload: CreateApiaryPayload): Observable<Apiary> {
        return this.http.post<Apiary>(this.apiUrl, payload);
    }

    updateApiary(id: number, payload: CreateApiaryPayload): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
    }

    deleteApiary(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
