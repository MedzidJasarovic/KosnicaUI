import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop anim-fade-in" *ngIf="show" (click)="confirmed.emit()">
      <div class="modal-panel glass-card anim-bounce-in" (click)="$event.stopPropagation()">
        
        <div class="icon-container" [ngClass]="isError ? 'error-bg' : 'success-bg'">
          <span class="icon">{{ isError ? '❗️' : '✅' }}</span>
        </div>

        <h2 class="title">{{ title }}</h2>
        <p class="message">{{ message }}</p>

        <button class="btn-primary" (click)="confirmed.emit()">Razumem</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
    }
    .modal-panel {
      background: white; padding: 40px 30px; border-radius: 28px; width: 90%; max-width: 400px;
      text-align: center; box-shadow: 0 24px 48px rgba(0,0,0,0.2);
    }
    .icon-container {
      width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px; font-size: 32px;
    }
    .error-bg { background: #fee2e2; color: #ef4444; }
    .success-bg { background: #dcfce7; color: #22c55e; }
    
    .title { margin: 0 0 10px; font-size: 24px; font-weight: 800; color: #111827; }
    .message { color: #6b7280; font-size: 15px; margin-bottom: 30px; line-height: 1.5; }
    
    .btn-primary {
      width: 100%; padding: 14px; border-radius: 14px; font-weight: 700; font-size: 16px;
      background: #f59e0b; color: white; border: none; cursor: pointer; transition: all 0.2s;
      &:hover { background: #d97706; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(245, 158, 11, 0.2); }
    }
    
    /* Animations */
    .anim-fade-in { animation: fadeIn 0.2s ease-out; }
    .anim-bounce-in { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bounceIn {
      0% { opacity: 0; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1); }
    }
  `]
})
export class NotificationModalComponent {
  @Input() show = false;
  @Input() title = '';
  @Input() message = '';
  @Input() isError = true;

  @Output() confirmed = new EventEmitter<void>();
}
