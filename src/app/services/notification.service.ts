import { Injectable, signal } from '@angular/core';

export interface NotificationState {
  show: boolean;
  message: string;
  title: string;
  isError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  state = signal<NotificationState>({
    show: false,
    message: '',
    title: '',
    isError: false
  });

  notify(message: string, isError: boolean = true, title?: string) {
    this.state.set({
      show: true,
      message,
      title: title || (isError ? 'Greška' : 'Obaveštenje'),
      isError
    });
  }

  showUnauthorized() {
    this.notify('Niste autorizovani za ovu radnju.', true, 'Pristup odbijen');
  }

  hide() {
    this.state.update(s => ({ ...s, show: false }));
  }
}
