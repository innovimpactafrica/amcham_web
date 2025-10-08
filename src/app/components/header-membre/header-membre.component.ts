import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { LanguageService } from '../../../services/language.service';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-header-membre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-membre.component.html',
  styleUrls: ['./header-membre.component.css']
})
export class HeaderMembreComponent implements OnInit {
  currentRoute: string = '/apropos'; // Défaut à "A propos"
  
  // Gestion des langues
  showLanguagePopup = false;
  languages: Language[] = [
    { code: 'FR', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'EN', name: 'Anglais', flag: 'https://flagcdn.com/w20/gb.png' }
  ];
  currentLanguage: Language = this.languages[0];

  // Menu mobile
  mobileMenuOpen = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService
  ) {
    this.currentRoute = this.router.url || '/apropos';
    if (this.currentRoute === '/' || this.currentRoute === '') {
      this.currentRoute = '/apropos';
    }
  }

  ngOnInit(): void {
    this.initializeLanguage();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateCurrentRoute(event.urlAfterRedirects);
    });
  }

  private initializeLanguage(): void {
    const currentLang = this.languageService.getCurrentLanguage();
    const foundLanguage = this.languages.find(lang => 
      lang.code.toLowerCase() === currentLang.toLowerCase()
    );
    
    if (foundLanguage) {
      this.currentLanguage = foundLanguage;
    } else {
      this.currentLanguage = this.languages[0];
      this.languageService.setLanguage('fr');
    }
  }

  private updateCurrentRoute(url: string): void {
    let newRoute = url;
    if (newRoute === '/' || newRoute === '') {
      newRoute = '/apropos';
    }
    this.currentRoute = newRoute;
    console.log('Route actuelle:', this.currentRoute);
  }

  // Navigation
  navigateToPropos(): void {
    if (this.currentRoute !== '/apropos') {
      this.router.navigate(['/apropos']);
      this.mobileMenuOpen = false;
    }
  }

  navigateToStatistique(): void {
    if (this.currentRoute !== '/statistique') {
      this.router.navigate(['/statistique']);
      this.mobileMenuOpen = false;
    }
  }

  navigateToMedia(): void {
    if (this.currentRoute !== '/media') {
      this.router.navigate(['/media']);
      this.mobileMenuOpen = false;
    }
  }

  navigateToHoraire(): void {
    if (this.currentRoute !== '/horaire') {
      this.router.navigate(['/horaire']);
      this.mobileMenuOpen = false;
    }
  }

  // Langues
  toggleLanguagePopup(event?: Event): void {
    if (event) event.stopPropagation();
    this.showLanguagePopup = !this.showLanguagePopup;
  }

  selectLanguage(languageCode: string, event?: Event): void {
    if (event) event.stopPropagation();
    const selectedLanguage = this.languages.find(lang => 
      lang.code.toLowerCase() === languageCode.toLowerCase()
    );

    if (selectedLanguage && this.currentLanguage.code !== selectedLanguage.code) {
      this.currentLanguage = selectedLanguage;
      this.showLanguagePopup = false;
      this.languageService.setLanguage(languageCode.toLowerCase());
      console.log(`Langue changée vers: ${selectedLanguage.name}`);
    } else {
      this.showLanguagePopup = false;
    }
  }

  // Gestion clic en dehors pour fermer popup
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const isLanguageSelector = target.closest('.language-selector');
    const isLanguagePopup = target.closest('.language-popup');
    if (this.showLanguagePopup && !isLanguageSelector && !isLanguagePopup) {
      this.showLanguagePopup = false;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showLanguagePopup) this.showLanguagePopup = false;
    if (this.mobileMenuOpen) this.mobileMenuOpen = false;
  }

  isActiveTab(route: string): boolean {
    return this.currentRoute === route;
  }
}
