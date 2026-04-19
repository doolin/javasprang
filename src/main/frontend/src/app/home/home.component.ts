import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/services/auth.service';
import { BackendUser, TodoItem, TodoService, TodoStatus } from '../core/services/todo.service';

@Component({
    selector: 'app-home',
    template: `
    <div class="kanban-page" *ngIf="currentUser; else loggedOut">
      <div class="kanban-header">
        <div>
          <h2 class="mb-1">Kanban Board</h2>
          <p class="text-muted mb-0">
            Signed in as <strong>{{ currentUser.username }}</strong>
          </p>
        </div>
        <button type="button" class="btn btn-outline-secondary" (click)="logout()">Logout</button>
      </div>

      <div class="alert alert-danger" *ngIf="error">
        {{ error }}
      </div>

      <form class="new-card-form" [formGroup]="newTodoForm" (ngSubmit)="createTodo()">
        <input
          type="text"
          class="form-control"
          formControlName="title"
          placeholder="New task title"
        >
        <input
          type="text"
          class="form-control"
          formControlName="description"
          placeholder="Description (optional)"
        >
        <select class="form-select" formControlName="status">
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <button type="submit" class="btn btn-primary" [disabled]="newTodoForm.invalid || loading">
          Add
        </button>
      </form>

      <div class="kanban-grid" *ngIf="!loading; else loadingState">
        <section class="kanban-column">
          <h3>To Do</h3>
          <div class="kanban-card" *ngFor="let todo of todosByStatus('TODO')">
            <h4>{{ todo.title }}</h4>
            <p *ngIf="todo.description" class="text-muted">{{ todo.description }}</p>
            <div class="card-controls">
              <select
                class="form-select form-select-sm"
                [value]="todo.status"
                (change)="updateStatus(todo, $any($event.target).value)"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteTodo(todo)">Delete</button>
            </div>
          </div>
        </section>

        <section class="kanban-column">
          <h3>In Progress</h3>
          <div class="kanban-card" *ngFor="let todo of todosByStatus('IN_PROGRESS')">
            <h4>{{ todo.title }}</h4>
            <p *ngIf="todo.description" class="text-muted">{{ todo.description }}</p>
            <div class="card-controls">
              <select
                class="form-select form-select-sm"
                [value]="todo.status"
                (change)="updateStatus(todo, $any($event.target).value)"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteTodo(todo)">Delete</button>
            </div>
          </div>
        </section>

        <section class="kanban-column">
          <h3>Done</h3>
          <div class="kanban-card" *ngFor="let todo of todosByStatus('DONE')">
            <h4>{{ todo.title }}</h4>
            <p *ngIf="todo.description" class="text-muted">{{ todo.description }}</p>
            <div class="card-controls">
              <select
                class="form-select form-select-sm"
                [value]="todo.status"
                (change)="updateStatus(todo, $any($event.target).value)"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteTodo(todo)">Delete</button>
            </div>
          </div>
        </section>
      </div>

      <ng-template #loadingState>
        <p class="text-muted">Loading board...</p>
      </ng-template>
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
  `,
    styles: [
        `
      .kanban-page {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
      }

      .kanban-header {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      .new-card-form {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: 1.2fr 1.5fr 0.8fr auto;
      }

      .kanban-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .kanban-column {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 0.5rem;
        min-height: 20rem;
        padding: 0.75rem;
      }

      .kanban-column h3 {
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
      }

      .kanban-card {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 0.5rem;
        margin-bottom: 0.75rem;
        padding: 0.75rem;
      }

      .kanban-card h4 {
        font-size: 1rem;
        margin-bottom: 0.35rem;
      }

      .kanban-card p {
        font-size: 0.9rem;
        margin-bottom: 0.75rem;
      }

      .card-controls {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: 1fr auto;
      }

      @media (max-width: 992px) {
        .kanban-grid {
          grid-template-columns: 1fr;
        }

        .new-card-form {
          grid-template-columns: 1fr;
        }
      }
    `
    ],
    standalone: false
})
export class HomeComponent {
  currentUser: User | null = null;
  backendUser: BackendUser | null = null;
  todos: TodoItem[] = [];
  error = '';
  loading = false;
  newTodoForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    status: ['TODO', [Validators.required]]
  });

  constructor(
    private authService: AuthService,
    private todoService: TodoService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.username) {
        this.loadBoard(user.username);
      } else {
        this.backendUser = null;
        this.todos = [];
      }
    });
  }

  todosByStatus(status: TodoStatus): TodoItem[] {
    return this.todos.filter(todo => todo.status === status);
  }

  private normalizeTodo(todo: TodoItem): TodoItem {
    const status = todo.status || (todo.completed ? 'DONE' : 'TODO');
    return {
      ...todo,
      status,
      completed: status === 'DONE'
    };
  }

  createTodo(): void {
    if (!this.backendUser || this.newTodoForm.invalid) {
      return;
    }

    const status = this.newTodoForm.value.status as TodoStatus;
    const payload: TodoItem = {
      title: (this.newTodoForm.value.title || '').trim(),
      description: (this.newTodoForm.value.description || '').trim(),
      status,
      completed: status === 'DONE',
      user: { id: this.backendUser.id }
    };

    if (!payload.title) {
      return;
    }

    this.todoService.createTodo(payload).subscribe({
      next: todo => {
        this.todos = [...this.todos, this.normalizeTodo(todo)];
        this.newTodoForm.reset({ title: '', description: '', status: 'TODO' });
        this.error = '';
      },
      error: () => {
        this.error = 'Unable to create todo card.';
      }
    });
  }

  updateStatus(todo: TodoItem, status: TodoStatus): void {
    const updated: TodoItem = {
      ...todo,
      status,
      completed: status === 'DONE'
    };

    this.todoService.updateTodo(updated).subscribe({
      next: saved => {
        const normalized = this.normalizeTodo(saved);
        this.todos = this.todos.map(item => item.id === saved.id ? normalized : item);
      },
      error: () => {
        this.error = 'Unable to update todo status.';
      }
    });
  }

  deleteTodo(todo: TodoItem): void {
    if (!todo.id) {
      return;
    }

    this.todoService.deleteTodo(todo.id).subscribe({
      next: () => {
        this.todos = this.todos.filter(item => item.id !== todo.id);
      },
      error: () => {
        this.error = 'Unable to delete todo.';
      }
    });
  }

  private loadBoard(username: string): void {
    this.loading = true;
    this.todoService.getUserByUsername(username).subscribe({
      next: user => {
        this.backendUser = user;
        this.todoService.getTodosByUserId(user.id).subscribe({
          next: todos => {
            this.todos = todos.map(todo => this.normalizeTodo(todo));
            this.error = '';
            this.loading = false;
          },
          error: () => {
            this.error = 'Unable to load todos for this user.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Unable to load current user profile.';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
