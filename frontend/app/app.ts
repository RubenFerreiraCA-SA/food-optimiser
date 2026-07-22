import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from './shared/components/topbar/topbar';
import { Snackbar } from './shared/components/snackbar/snackbar';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Topbar, Snackbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly showLocalBanner = environment.apiBaseUrl.includes('localhost');
}
