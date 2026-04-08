import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { AuthService, VetColleague } from '../services/auth.service';

@Component({
  selector: 'app-colleagues',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './colleagues.component.html',
  styleUrl: './colleagues.component.scss'
})
export class ColleaguesComponent implements OnInit {
  colleagues: VetColleague[] = [];
  loading = true;
  error = '';
  currentUser = this.authService.currentUser;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadColleagues();
  }

  loadColleagues() {
    this.loading = true;
    this.authService.getColleagues().subscribe({
      next: (data) => {
        this.colleagues = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Greška pri učitavanju kolega.';
        this.loading = false;
      }
    });
  }
}
