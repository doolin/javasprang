import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-container">
      <h2 class="text-center mb-4">Login</h2>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            class="form-control"
            id="username"
            formControlName="username"
            [class.is-invalid]="username.invalid && (username.dirty || username.touched)"
          >
          <div class="invalid-feedback" *ngIf="username.invalid && (username.dirty || username.touched)">
            <div *ngIf="username.errors?.['required']">Username is required.</div>
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            class="form-control"
            id="password"
            formControlName="password"
            [class.is-invalid]="password.invalid && (password.dirty || password.touched)"
          >
          <div class="invalid-feedback" *ngIf="password.invalid && (password.dirty || password.touched)">
            <div *ngIf="password.errors?.['required']">Password is required.</div>
          </div>
        </div>

        <div class="alert alert-danger" *ngIf="error">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary w-100" [disabled]="loginForm.invalid">
          Login
        </button>

        <div class="text-center mt-3">
          <a routerLink="/register">Don't have an account? Register</a>
        </div>
      </form>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  get username() { return this.loginForm.get('username')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.username.value, this.password.value)
        .subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.error = err.error.message || 'An error occurred during login';
          }
        });
    }
  }
} 