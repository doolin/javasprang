import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = '/api/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    const loginData = {
      username: 'testuser',
      password: 'password'
    };

    const mockResponse = {
      token: 'test-token',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      }
    };

    it('should make POST request to login endpoint', () => {
      service.login(loginData.username, loginData.password).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(mockResponse);
    });

    it('should store token and user in localStorage on successful login', () => {
      service.login(loginData.username, loginData.password).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);

      expect(localStorage.getItem('token')).toBe(mockResponse.token);
      expect(localStorage.getItem('currentUser')).toBe(JSON.stringify(mockResponse.user));
    });

    it('should update currentUser$ observable on successful login', (done) => {
      service.currentUser$.subscribe(user => {
        expect(user).toEqual(mockResponse.user);
        done();
      });

      service.login(loginData.username, loginData.password).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);
    });
  });

  describe('register', () => {
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password'
    };

    const mockResponse = {
      token: 'test-token',
      user: {
        id: 1,
        username: registerData.username,
        email: registerData.email
      }
    };

    it('should make POST request to register endpoint', () => {
      service.register(registerData.username, registerData.email, registerData.password).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush(mockResponse);
    });

    it('should store token and user in localStorage on successful registration', () => {
      service.register(registerData.username, registerData.email, registerData.password).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/register`);
      req.flush(mockResponse);

      expect(localStorage.getItem('token')).toBe(mockResponse.token);
      expect(localStorage.getItem('currentUser')).toBe(JSON.stringify(mockResponse.user));
    });

    it('should update currentUser$ observable on successful registration', (done) => {
      service.currentUser$.subscribe(user => {
        expect(user).toEqual(mockResponse.user);
        done();
      });

      service.register(registerData.username, registerData.email, registerData.password).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/register`);
      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should clear localStorage', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('currentUser', JSON.stringify({ id: 1, username: 'testuser' }));

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });

    it('should update currentUser$ observable to null', (done) => {
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });

      service.logout();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'test-token');
      expect(service.isAuthenticated()).toBeTruthy();
    });

    it('should return false when token does not exist', () => {
      expect(service.isAuthenticated()).toBeFalsy();
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      const token = 'test-token';
      localStorage.setItem('token', token);
      expect(service.getToken()).toBe(token);
    });

    it('should return null when token does not exist', () => {
      expect(service.getToken()).toBeNull();
    });
  });
}); 