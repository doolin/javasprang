import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-container">
      <h2 class="text-center mb-4">Register</h2>
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
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
          <label for="email">Email</label>
          <input
            type="email"
            class="form-control"
            id="email"
            formControlName="email"
            [class.is-invalid]="email.invalid && (email.dirty || email.touched)"
          >
          <div class="invalid-feedback" *ngIf="email.invalid && (email.dirty || email.touched)">
            <div *ngIf="email.errors?.['required']">Email is required.</div>
            <div *ngIf="email.errors?.['email']">Please enter a valid email address.</div>
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
            <div *ngIf="password.errors?.['minlength']">Password must be at least 6 characters.</div>
          </div>
        </div>

        <div class="alert alert-danger" *ngIf="error">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary w-100" [disabled]="registerForm.invalid">
          Register
        </button>

        <div class="text-center mt-3">
          <a routerLink="/login">Already have an account? Login</a>
        </div>
      </form>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get username() { return this.registerForm.get('username')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.authService.register(this.username.value, this.email.value, this.password.value)
        .subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.error = err.error.message || 'An error occurred during registration';
          }
        });
    }
  }
} 