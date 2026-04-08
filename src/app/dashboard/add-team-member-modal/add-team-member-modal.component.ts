import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-team-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-team-member-modal.component.html',
  styleUrl: './add-team-member-modal.component.scss'
})
export class AddTeamMemberModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() added = new EventEmitter<void>();

  selectedRole: 'Assistant' | 'Veterinarian' = 'Assistant';
  loading = false;
  success = false;
  errorMsg = '';

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  constructor(private authService: AuthService) {}

  get roleInfo() {
    if (this.selectedRole === 'Assistant') {
      return {
        title: 'Asistent',
        icon: '🐝',
        color: '#f59e0b',
        permissions: [
          { icon: '✅', text: 'Može upravljati košnicama (pregled, izmena stanja)' },
          { icon: '✅', text: 'Može kreirati, izvršiti i otkazati zadatke/intervencije' },
          { icon: '✅', text: 'Može da dodaje zapise o vrcanju i prinosu' },
          { icon: '✅', text: 'Pristup vremenskoj prognozi i statistikama' },
          { icon: '❌', text: 'Ne može kreirati, menjati niti brisati pčelinjake' },
          { icon: '❌', text: 'Ne može kreirati, menjati niti brisati košnice' },
          { icon: '❌', text: 'Ne može dodavati nove saradnike u tim' },
        ]
      };
    } else {
      return {
        title: 'Veterinar',
        icon: '🩺',
        color: '#3b82f6',
        permissions: [
          { icon: '✅', text: 'Može pregledati sav sadržaj sistema (košnice, pčelinjaci)' },
          { icon: '✅', text: 'Može zakazati i izvršiti preglede i tretmane košnica' },
          { icon: '✅', text: 'Može propisati i administrirati lekove' },
          { icon: '✅', text: 'Unos beleški o reakcijama pčela i gubicima' },
          { icon: '❌', text: 'Ne može menjati strukturu pčelinjaka ni košnica' },
          { icon: '❌', text: 'Ne može upravljati zalihama (magacin)' },
          { icon: '❌', text: 'Ne može dodavati nove saradnike u tim' },
        ]
      };
    }
  }

  submit() {
    this.errorMsg = '';
    this.loading = true;
    this.authService.registerTeamMember({
      ...this.form,
      role: this.selectedRole
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.added.emit();
          this.closed.emit();
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error || 'Greška pri dodavanju saradnika.';
      }
    });
  }
}
