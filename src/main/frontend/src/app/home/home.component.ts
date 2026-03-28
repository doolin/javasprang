import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/services/auth.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="auth-container" *ngIf="currentUser; else loggedOut">
      <h2 class="text-center mb-3">Welcome</h2>
      <p class="text-center mb-3">
        Signed in as <strong>{{ currentUser.username }}</strong>
      </p>
      <p class="text-center text-muted mb-4">{{ currentUser.email }}</p>
      <button type="button" class="btn btn-secondary w-100" (click)="logout()">
        Logout
      </button>
    </div>

    <ng-template #loggedOut>
      <div class="auth-container text-center">
        <h2 class="mb-3">Not signed in</h2>
        <p class="text-muted mb-4">Use the links below to log in or register.</p>
        <div class="d-grid gap-2">
          <a routerLink="/login" class="btn btn-primary">Go to Login</a>
          <a routerLink="/register" class="btn btn-outline-primary">Go to Register</a>
        </div>
      </div>
    </ng-template>
  `
})
export class HomeComponent {
  currentUser: User | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
