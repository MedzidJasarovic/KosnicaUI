import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
    id: number;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
}

export interface VetColleague {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isCurrentUser: boolean;
    employerFirstName: string | null;
    employerLastName: string | null;
    employerEmail: string | null;
}

export interface AuthResponse {
    token: string;
    userId: number;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'https://kosnicaapi.onrender.com/api/auth';
    //private apiUrl = 'http://localhost:5264/api/auth';

    // Using Angular Signals for reactive state
    currentUser = signal<User | null>(this.getUserFromStorage());

    constructor(private http: HttpClient, private router: Router) { }

    login(credentials: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(res => this.handleAuth(res))
        );
    }

    register(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, userData);
    }

    registerTeamMember(payload: { firstName: string; lastName: string; email: string; password: string; role: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/register-team`, payload);
    }

    getColleagues(): Observable<VetColleague[]> {
        return this.http.get<VetColleague[]>(`${this.apiUrl}/colleagues`);
    }

    logout() {
        localStorage.removeItem('kosnica_token');
        localStorage.removeItem('kosnica_user');
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('kosnica_token');
    }

    private handleAuth(res: AuthResponse) {
        const user: User = {
            id: res.userId,
            email: res.email,
            role: res.role,
            firstName: res.firstName,
            lastName: res.lastName
        };
        localStorage.setItem('kosnica_token', res.token);
        localStorage.setItem('kosnica_user', JSON.stringify(user));
        this.currentUser.set(user);
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('kosnica_user');
        return userStr ? JSON.parse(userStr) : null;
    }
}
