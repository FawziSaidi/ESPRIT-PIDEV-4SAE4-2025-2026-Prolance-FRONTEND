import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  navbarTransparent = true;
  currentYear = new Date().getFullYear();
  activeFaq: number = -1;
  activeTestimonial: number = 0;

  testimonials = [
    {
      quote: 'Prolance changed my freelance career. Within a week I landed a $15k project with zero commission taken. The platform is incredibly smooth and professional.',
      name: 'Sarah Chen',
      role: 'Full-Stack Developer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    },
    {
      quote: 'As a recruiter, finding vetted talent used to take weeks. With Prolance, I posted a job and had five qualified candidates in 48 hours. Absolutely game-changing.',
      name: 'Marcus Rivera',
      role: 'CTO at Finova',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    {
      quote: 'The fast payment system is the real differentiator. I get paid within a day of milestone approval — no more chasing invoices. Prolance just works.',
      name: 'Amina Okafor',
      role: 'UX Designer',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
    }
  ];

  private observer!: IntersectionObserver;
  private testimonialInterval: any;

  constructor(private router: Router, private el: ElementRef) {}

  ngOnInit(): void {
    document.body.classList.add('landing-page');
  }

  ngAfterViewInit(): void {
    this.initScrollReveal();
    this.startTestimonialRotation();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('landing-page');
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.testimonialInterval) {
      clearInterval(this.testimonialInterval);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.navbarTransparent = window.scrollY < 80;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? -1 : index;
  }

  setTestimonial(index: number): void {
    this.activeTestimonial = index;
  }

  private initScrollReveal(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.12
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.observer.unobserve(entry.target);
        }
      });
    }, options);

    const revealElements = this.el.nativeElement.querySelectorAll('.reveal');
    revealElements.forEach((el: Element) => this.observer.observe(el));
  }

  private startTestimonialRotation(): void {
    this.testimonialInterval = setInterval(() => {
      this.activeTestimonial = (this.activeTestimonial + 1) % this.testimonials.length;
    }, 6000);
  }
}
