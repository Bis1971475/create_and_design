import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { NotificationService } from './services/notification';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,NavbarComponent,Footer],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('create-and-design');
  protected readonly toastMessage;

  constructor(notificationService: NotificationService) {
    this.toastMessage = notificationService.message;
  }
}
