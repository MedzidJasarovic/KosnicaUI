import { environment } from "../../environments/environment";
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 'zdrava' i 'varoa' daje trenutni model (VarroaDataset).
// 'varoa_grinje' i 'drugi_problem' su iz prvog modela (BeeImage) — ostaju zbog starih zapisa u istoriji.
export type BeeHealthLabel = 'zdrava' | 'varoa' | 'varoa_grinje' | 'drugi_problem';

export interface BeeHealthCheck {
    id: number;
    hiveId: number;
    imageUrl: string;
    predictedLabel: BeeHealthLabel;
    confidence: number;
    probabilities: Partial<Record<BeeHealthLabel, number>>;
    modelVersion: string;
    createdAt: string;
    createdByName?: string;
}

export const BEE_HEALTH_LABELS: Record<BeeHealthLabel, string> = {
    zdrava: 'Zdrava',
    varoa: 'Varoa',
    varoa_grinje: 'Varoa / grinje',
    drugi_problem: 'Drugi problem'
};

@Injectable({
    providedIn: 'root'
})
export class BeeHealthService {
    private apiUrl = environment.apiUrl + '/hives';
    // Slike servira backend sa svoje adrese, van /api
    private fileHost = environment.apiUrl.replace(/\/api$/, '');

    constructor(private http: HttpClient) { }

    getHistory(hiveId: number): Observable<BeeHealthCheck[]> {
        return this.http.get<BeeHealthCheck[]>(`${this.apiUrl}/${hiveId}/health-checks`);
    }

    analyze(hiveId: number, file: File): Observable<BeeHealthCheck> {
        const form = new FormData();
        form.append('file', file);
        return this.http.post<BeeHealthCheck>(`${this.apiUrl}/${hiveId}/health-checks`, form);
    }

    delete(hiveId: number, id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${hiveId}/health-checks/${id}`);
    }

    imageSrc(imageUrl: string): string {
        return imageUrl.startsWith('http') ? imageUrl : this.fileHost + imageUrl;
    }
}
