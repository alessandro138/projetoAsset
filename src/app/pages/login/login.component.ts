import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  /** Query params: rota para voltar depois do login; aviso de falta de permissão */
  readonly voltar = input<string>();
  readonly semPermissao = input<string>();

  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    const error = await this.auth.signIn(email, password);
    this.loading.set(false);
    if (error) {
      this.error.set(error);
      return;
    }
    if (this.auth.hasRole('admin', 'secretaria', 'editor')) {
      this.router.navigateByUrl(this.voltar() || '/cadastro/pessoas');
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.form.reset();
  }
}
