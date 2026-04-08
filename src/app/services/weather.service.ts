import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeatherData {
    description: string;
    temperatureCelsius: number;
    windSpeedKmH: number;
    humidityPercent: number;
    isSafeToOpen: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class WeatherService {
    private apiUrl = 'https://kosnicaapi.onrender.com/api/weather';

    constructor(private http: HttpClient) { }

    getWeatherForApiary(apiaryId: number): Observable<WeatherData> {
        return this.http.get<WeatherData>(`${this.apiUrl}/apiaries/${apiaryId}`);
    }
}
