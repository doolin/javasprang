import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    
    await TestBed.configureTestingModule({
      declarations: [ RegisterComponent ],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.registerForm.get('username')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
  });

  it('should be invalid when empty', () => {
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should be invalid with invalid email', () => {
    component.registerForm.controls['username'].setValue('testuser');
    component.registerForm.controls['email'].setValue('invalid-email');
    component.registerForm.controls['password'].setValue('password');
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should be invalid with short password', () => {
    component.registerForm.controls['username'].setValue('testuser');
    component.registerForm.controls['email'].setValue('test@example.com');
    component.registerForm.controls['password'].setValue('12345');
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should be valid when properly filled', () => {
    component.registerForm.controls['username'].setValue('testuser');
    component.registerForm.controls['email'].setValue('test@example.com');
    component.registerForm.controls['password'].setValue('password123');
    expect(component.registerForm.valid).toBeTruthy();
  });

  it('should call authService.register on submit', () => {
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    authService.register.and.returnValue(of({ token: 'test-token', user: { id: 1, username: testUser.username, email: testUser.email } }));
    
    component.registerForm.controls['username'].setValue(testUser.username);
    component.registerForm.controls['email'].setValue(testUser.email);
    component.registerForm.controls['password'].setValue(testUser.password);
    component.onSubmit();

    expect(authService.register).toHaveBeenCalledWith(testUser.username, testUser.email, testUser.password);
  });

  it('should handle registration error', () => {
    const errorMessage = 'Username already exists';
    authService.register.and.returnValue(throwError(() => ({ error: { message: errorMessage } })));
    
    component.registerForm.controls['username'].setValue('testuser');
    component.registerForm.controls['email'].setValue('test@example.com');
    component.registerForm.controls['password'].setValue('password123');
    component.onSubmit();

    expect(component.error).toBe(errorMessage);
  });
}); 