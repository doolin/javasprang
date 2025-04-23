import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container">
        <a class="navbar-brand" href="#">Todo App</a>
        <div class="navbar-nav ms-auto">
          <a class="nav-link" routerLink="/login" routerLinkActive="active">Login</a>
          <a class="nav-link" routerLink="/register" routerLinkActive="active">Register</a>
        </div>
      </div>
    </nav>
    <div class="container">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'todo-app-frontend';
} 