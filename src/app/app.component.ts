import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationModalComponent } from './shared/components/notification-modal/notification-modal.component';
import { NotificationService } from './services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationModalComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'KosnicaUI';
  private notificationService = inject(NotificationService);

  get state() {
    return this.notificationService.state();
  }

  hideNotification() {
    this.notificationService.hide();
  }
}
