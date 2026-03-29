import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalToastComponent } from './shared/components/global-toast/global-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('erp-frontend');
}
