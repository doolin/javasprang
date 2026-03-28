import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TodoStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TodoUserRef {
  id: number;
}

export interface TodoItem {
  id?: number;
  title: string;
  description?: string;
  status: TodoStatus;
  completed: boolean;
  user: TodoUserRef;
}

export interface BackendUser {
  id: number;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  constructor(private http: HttpClient) {}

  getUserByUsername(username: string): Observable<BackendUser> {
    return this.http.get<BackendUser>(`/api/v1/users/username/${encodeURIComponent(username)}`);
  }

  getTodosByUserId(userId: number): Observable<TodoItem[]> {
    return this.http.get<TodoItem[]>(`/api/v1/todos/user/${userId}`);
  }

  createTodo(todo: TodoItem): Observable<TodoItem> {
    return this.http.post<TodoItem>('/api/v1/todos', todo);
  }

  updateTodo(todo: TodoItem): Observable<TodoItem> {
    return this.http.put<TodoItem>(`/api/v1/todos/${todo.id}`, todo);
  }

  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/todos/${id}`);
  }
}
