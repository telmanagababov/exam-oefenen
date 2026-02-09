import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { GeminiConfigService } from './services/gemini-config.service';
import { NavigationService } from './services/navigation.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('exam-oefenen-client');

  // Inject NavigationService to ensure it's initialized and starts listening to router events
  private navigationService = inject(NavigationService);
  private configService = inject(GeminiConfigService);

  async ngOnInit(): Promise<void> {
    // Initialize config service to check server config
    await this.configService.initialize();
  }
}
