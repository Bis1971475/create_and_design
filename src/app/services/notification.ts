import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly message = signal<string | null>(null);
  private timeoutId?: number;

  success(text: string, durationMs = 2200): void {
    this.message.set(text);

    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.message.set(null);
      this.timeoutId = undefined;
    }, durationMs);
  }
}
