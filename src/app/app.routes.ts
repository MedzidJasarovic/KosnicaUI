import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ApiariesComponent } from './apiaries/apiaries.component';
import { ApiaryDetailComponent } from './apiaries/apiary-detail/apiary-detail.component';
import { StorageComponent } from './storage/storage.component';
import { InterventionsComponent } from './interventions/interventions.component';
import { ColleaguesComponent } from './colleagues/colleagues.component';
import { authGuard } from './guards/auth.guard';


export const routes: Routes = [
    { path: '', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'apiaries', component: ApiariesComponent, canActivate: [authGuard] },
    { path: 'apiaries/:id', component: ApiaryDetailComponent, canActivate: [authGuard] },
    { path: 'storage', component: StorageComponent, canActivate: [authGuard] },
    { path: 'interventions', component: InterventionsComponent, canActivate: [authGuard] },
    { path: 'colleagues', component: ColleaguesComponent, canActivate: [authGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '**', redirectTo: '' }
];
