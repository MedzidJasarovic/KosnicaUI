import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  dto = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';

  constructor(
      private authService: AuthService,
      private router: Router,
      private notificationService: NotificationService
  ) { }

  onRegister() {
    if (!this.dto.firstName || !this.dto.lastName || !this.dto.email || !this.dto.password) {
      this.errorMessage = 'Molimo popunite sva polja.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.dto).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.notificationService.notify('Registracija je uspešna! Možete se prijaviti.', false, 'Uspešno');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error || 'Došlo je do greške prilikom registracije.';
      }
    });
  }
}
