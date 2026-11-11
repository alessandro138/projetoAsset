import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { PersonService } from '../../services/person.service';
import { PASSWORD_RULES, generateSecurePassword } from '../../shared/utils/password';
import { passwordsMatchValidator, strongPasswordValidator } from '../../shared/validators/password.validator';

/** Troca de senha; obrigatória no primeiro acesso (senha provisória criada no painel do Supabase) */
@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styles: `.suggestion-box { background: var(--color-blue-light); }`,
})
export class ChangePasswordComponent {
  /** Query param: rota para voltar depois da troca */
  readonly voltar = input<string>();

  readonly auth = inject(AuthService);
  private readonly personService = inject(PersonService);
  private readonly router = inject(Router);

  readonly rules = PASSWORD_RULES;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly suggestion = signal('');
  readonly copied = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      password: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator() },
  );

  private readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  readonly ruleStatus = computed(() => this.rules.map(rule => ({ label: rule.label, ok: rule.test(this.password()) })));

  suggest(): void {
    this.suggestion.set(generateSecurePassword());
    this.copied.set(false);
  }

  useSuggestion(): void {
    const password = this.suggestion();
    this.form.setValue({ password, confirmPassword: password });
    this.showPassword.set(true);
  }

  async copySuggestion(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.suggestion());
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  async submit(): Promise<void> {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const error = await this.auth.changePassword(this.form.controls.password.value);
    this.saving.set(false);
    if (error) {
      this.error.set(error);
      return;
    }
    this.form.reset();
    this.suggestion.set('');
    // Encerra a sessão e pede para entrar de novo, já com a nova senha
    await this.auth.signOut();
    this.personService.clear();
    this.router.navigate(['/login'], { queryParams: { senhaAlterada: 1, voltar: this.voltar() || null } });
  }
}
