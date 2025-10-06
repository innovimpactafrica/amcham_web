import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { LanguageService } from '../../../services/language.service';
import { CompanyService, Company, CompanySchedule, Ratings } from '../../../services/company.service';
import { HomeService, Company as HomeCompany } from '../../../services/home.service';
import { Subscription, forkJoin } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface MembreDisplay {
  id: number;
  name: string;
  categoryFr: string;
  categoryEn: string;
  locationFr: string;
  locationEn: string;
  phone: string;
  website: string;
  descriptionFr: string;
  descriptionEn: string;
  logo: string;
  pictures: string[];
  address?: string;
  email?: string;
  country?: string;
  countryAmcham?: string;
}

@Component({
  selector: 'app-details-membre',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './details-membre.component.html',
  styleUrls: ['./details-membre.component.css']
})
export class DetailsMembreComponent implements OnInit, OnDestroy {
  private langSubscription!: Subscription;
  currentLang = 'fr';
  displayedRatings: Ratings[] = [];
  currentRatingIndex: number = 0;
  noTransition: boolean = false;
  private ratingInterval?: any;
  membreId: number = 0;
  membre: Company | null = null;
  horaires: CompanySchedule[] = [];
  ratings: Ratings[] = [];
  membresSimilaires: MembreDisplay[] = [];
  isLoading = true;
  mapUrl: SafeResourceUrl | null = null;

  certificationsSimules = [
    'ISO 9001:2015',
    'SOC 2 Type II',
    'AWS Partner',
    'Microsoft Gold Partner'
  ];
  
  servicesSimulesFr = [
    'Développement d\'applications web et mobiles',
    'Solutions cloud et infrastructure',
    'Intelligence artificielle et machine learning',
    'Consultation technologique',
    'Support et maintenance'
  ];
  
  servicesSimulesEn = [
    'Web and mobile application development',
    'Cloud solutions and infrastructure',
    'Artificial intelligence and machine learning',
    'Technology consulting',
    'Support and maintenance'
  ];

  get texts() {
    return this.currentLang === 'fr' ? {
      giveReview: 'Donner un avis',
      founded: 'Fondée en',
      employees: 'actifs',
      coordinates: 'Coordonnées',
      address: 'Adresse',
      phone: 'Téléphone',
      email: 'Email',
      website: 'Site web',
      contact: 'Contacter',
      openingHours: 'Horaires d\'ouverture',
      closed: 'Fermé',
      presentation: 'Présentation',
      services: 'Services proposés',
      certifications: 'Certifications & Labels',
      photoGallery: 'Galerie photos',
      presentationVideo: 'Vidéo de présentation',
      clickToWatch: 'Cliquer pour voir la vidéo',
      location: 'Localisation',
      viewOnMap: 'Voir sur la carte',
      reviews: 'Avis & notes',
      similarMembers: 'Membres similaires',
      seeAllMembers: 'Voir tous les membres',
      memberNotFound: 'Membre non trouvé',
      memberNotFoundDesc: 'Le membre que vous cherchez n\'existe pas ou a été supprimé.',
      seeAllMembersBtn: 'Voir tous les membres',
      contactBtn: 'Contacter',
      viewProfile: 'Voir la fiche',
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
      discoverMembers: 'Découvrez quelques-uns de nos membres et explorez les opportunités de collaboration',
      avis: 'avis',
      review: 'review',
      reviewsPlural: 'reviews'
    } : {
      giveReview: 'Give review',
      founded: 'Founded in',
      employees: 'employees',
      coordinates: 'Contact Information',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      website: 'Website',
      contact: 'Contact',
      openingHours: 'Opening Hours',
      closed: 'Closed',
      presentation: 'Presentation',
      services: 'Services Offered',
      certifications: 'Certifications & Labels',
      photoGallery: 'Photo Gallery',
      presentationVideo: 'Presentation Video',
      clickToWatch: 'Click to watch video',
      location: 'Location',
      viewOnMap: 'View on map',
      reviews: 'Reviews & Ratings',
      similarMembers: 'Similar Members',
      seeAllMembers: 'See all members',
      memberNotFound: 'Member not found',
      memberNotFoundDesc: 'The member you are looking for does not exist or has been deleted.',
      seeAllMembersBtn: 'See all members',
      contactBtn: 'Contact',
      viewProfile: 'View profile',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      discoverMembers: 'Discover some of our members and explore collaboration opportunities',
      avis: 'review',
      review: 'review',
      reviewsPlural: 'reviews'
    };
  }

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private languageService: LanguageService,
    private companyService: CompanyService,
    private homeService: HomeService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.membreId = +params['id'];
      this.loadMembreDetails();
      this.loadMembresSimilaires();
    });

    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });

    this.currentLang = this.languageService.getCurrentLanguage();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    if (this.ratingInterval) {
      clearInterval(this.ratingInterval);
    }
  }

  loadMembreDetails() {
    this.isLoading = true;
    forkJoin({
      company: this.companyService.getCompanyById(this.membreId),
      schedules: this.companyService.getHoraire(this.membreId)
    }).subscribe({
      next: ({ company, schedules }) => {
        this.membre = company;
        console.log('Données du membre:', this.membre);
        this.horaires = schedules;
        this.isLoading = false;

        // Initialiser la carte après avoir chargé les données du membre
        this.initializeMap();

        this.companyService.getRatings(this.membreId).subscribe({
          next: (ratings) => {
            this.ratings = ratings;
            if (this.ratings.length < 3) {
              while (this.ratings.length < 3) {
                this.ratings = [...this.ratings, ...this.ratings.slice(0, 3 - this.ratings.length)];
              }
              this.displayedRatings = this.ratings;
            } else {
              this.displayedRatings = [
                ...this.ratings.slice(-2),
                ...this.ratings,
                ...this.ratings.slice(0, 2)
              ];
              this.currentRatingIndex = 2;
              this.startRatingCarousel();
            }
          },
          error: (error) => {
            console.warn('Aucun rating disponible pour cette entreprise', error);
            this.ratings = [];
            this.displayedRatings = [];
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données du membre:', error);
        this.isLoading = false;
        this.router.navigate(['/membres']);
      }
    });
  }

  // Méthode pour initialiser la carte Google Maps
  private initializeMap(): void {
    if (this.membre?.lat && this.membre?.lon) {
      const url = `https://www.google.com/maps?q=${this.membre.lat},${this.membre.lon}&hl=${this.currentLang}&z=15&output=embed`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      console.log('Carte initialisée avec les coordonnées:', this.membre.lat, this.membre.lon);
    } else {
      console.warn('Coordonnées GPS non disponibles pour ce membre');
      this.mapUrl = null;
    }
  }

  loadMembresSimilaires() {
    const params: any = {
      page: 0,
      size: 3,
      sector: this.membre?.sector,
      country: this.membre?.country
    };
    this.homeService.getMembres(params).subscribe({
      next: (response) => {
        this.membresSimilaires = response.content
          .filter(company => company.id !== this.membreId)
          .slice(0, 3)
          .map(company => this.mapCompanyToMembreDisplay(company));
      },
      error: (error) => {
        console.error('Erreur lors du chargement des membres similaires:', error);
        this.membresSimilaires = [];
      }
    });
  }

  private mapCompanyToMembreDisplay(company: HomeCompany): MembreDisplay {
    return {
      id: company.id,
      name: company.name,
      categoryFr: company.sector,
      categoryEn: company.sector,
      locationFr: company.country,
      locationEn: company.country,
      phone: company.telephone || 'N/A',
      website: company.webLink || 'N/A',
      descriptionFr: company.description || '',
      descriptionEn: company.description || '',
      logo: company.logo,
      pictures: company.pictures || [],
      address: company.address,
      email: company.email,
      country: company.country,
      countryAmcham: company.countryAmcham
    };
  }

  getSafeVideoUrl(): SafeResourceUrl | null {
    if (!this.membre?.videoLink) return null;
    // Convert YouTube watch URL to embed URL
    const videoId = this.membre.videoLink.split('v=')[1]?.split('&')[0];
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : this.membre.videoLink;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  startRatingCarousel() {
    this.ratingInterval = setInterval(() => {
      this.nextRating();
    }, 4000);
  }

  nextRating() {
    if (this.currentRatingIndex === this.ratings.length + 1) {
      this.noTransition = true;
      this.currentRatingIndex = 1;
      setTimeout(() => {
        this.noTransition = false;
      }, 0);
    } else {
      this.currentRatingIndex++;
    }
  }

  getActiveDot(): number {
    return (this.currentRatingIndex - 1) % this.ratings.length;
  }

  getAverageRating(): number {
    if (!this.ratings || this.ratings.length === 0) {
      return 0;
    }
    const sum = this.ratings.reduce((acc, rating) => acc + rating.score, 0);
    const average = sum / this.ratings.length;
    return Math.round(average * 10) / 10;
  }

  getTotalReviews(): number {
    return this.ratings ? this.ratings.length : 0;
  }

  getReviewText(): string {
    const count = this.getTotalReviews();
    if (this.currentLang === 'fr') {
      return count <= 1 ? this.texts.avis : this.texts.avis;
    } else {
      return count <= 1 ? this.texts.review : this.texts.reviewsPlural;
    }
  }

  getFormattedHoraires(): any {
    const horairesObj: any = {};
    this.horaires.forEach(schedule => {
      const dayKey = this.getTranslatedDay(schedule.dayOfWeek);
      if (schedule.closed) {
        horairesObj[dayKey] = this.texts.closed;
      } else if (schedule.openingTime && schedule.closingTime) {
        horairesObj[dayKey] = `${schedule.openingTime} - ${schedule.closingTime}`;
      } else {
        horairesObj[dayKey] = this.texts.closed;
      }
    });
    return horairesObj;
  }

  getTranslatedDay(day: string): string {
    const daysMap: { [key: string]: { fr: string, en: string } } = {
      'MONDAY': { fr: 'Lundi', en: 'Monday' },
      'TUESDAY': { fr: 'Mardi', en: 'Tuesday' },
      'WEDNESDAY': { fr: 'Mercredi', en: 'Wednesday' },
      'THURSDAY': { fr: 'Jeudi', en: 'Thursday' },
      'FRIDAY': { fr: 'Vendredi', en: 'Friday' },
      'SATURDAY': { fr: 'Samedi', en: 'Saturday' },
      'SUNDAY': { fr: 'Dimanche', en: 'Sunday' }
    };
    return this.currentLang === 'fr'
      ? daysMap[day]?.fr || day
      : daysMap[day]?.en || day;
  }

  getTranslatedDays(): string[] {
    return this.currentLang === 'fr' ?
      ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] :
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  }

  getServices(): string[] {
    return this.currentLang === 'fr' ? this.servicesSimulesFr : this.servicesSimulesEn;
  }

  getCompleteAddress(): string {
    if (!this.membre) return '';
    const addressParts = [this.membre.address, this.membre.city, this.membre.country]
      .filter(part => part && part.trim() !== '');
    return addressParts.join(', ');
  }

  laisserAvis() {
    console.log('Laisser un avis pour:', this.membre?.name);
  }

  contactMembre(membre: MembreDisplay): void {
    if (membre.email) {
      window.location.href = `mailto:${membre.email}`;
    } else {
      console.log('Contacter:', membre.name);
    }
  }

  voirFiche(membreId: number) {
    this.router.navigate(['/membre', membreId]);
  }

  voirTousLesMembres() {
    this.router.navigate(['/membres']);
  }

  getStarsArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  openMap() {
    if (!this.membre) return;
    const encodedAddress = encodeURIComponent(this.getCompleteAddress());
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
  }

  callPhone() {
    if (!this.membre) return;
    window.location.href = `tel:${this.membre.telephone}`;
  }

  sendEmail() {
    if (!this.membre) return;
    window.location.href = `mailto:${this.membre.email}`;
  }

  visitWebsite() {
    if (!this.membre) return;
    let website = this.membre.webLink;
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      website = 'https://' + website;
    }
    window.open(website, '_blank');
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '';
  }

  getMemberImageUrl(picture: string): string {
    return this.homeService.getCompanyImageUrl(picture);
  }

  getTranslatedProperty(membre: MembreDisplay, property: string): string {
    const langSuffix = this.currentLang === 'fr' ? 'Fr' : 'En';
    const key = `${property}${langSuffix}` as keyof MembreDisplay;
    return (membre[key] as string) || '';
  }
}