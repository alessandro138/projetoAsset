import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ACCESS_LEVELS, ASSIGNABLE_LEVELS, AccessLevel, SystemUser } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { UserAdminService } from '../../../services/user-admin.service';
import { PASSWORD_RULES, generateSecurePassword } from '../../../shared/utils/password';
import { strongPasswordValidator } from '../../../shared/validators/password.validator';

/**
 * Módulo Usuários: "Minha conta" (todos) e gestão de usuários (nível avançado ou admin).
 * Admins não podem ser criados, alterados nem excluídos por aqui (só no banco).
 */
@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  readonly auth = inject(AuthService);
  readonly admin = inject(UserAdminService);
  private readonly fb = inject(FormBuilder);

  readonly levels = ACCESS_LEVELS;
  readonly assignableLevels = ASSIGNABLE_LEVELS;
  readonly passwordRules = PASSWORD_RULES;
  readonly canManage = computed(() => this.auth.hasLevel('avancado'));

  // Minha conta
  readonly nameForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
  });
  readonly nameSaving = signal(false);
  readonly nameMessage = signal<{ ok: boolean; text: string } | null>(null);

  // Novo usuário
  readonly newUserForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    level: ['basico' as AccessLevel, Validators.required],
    password: [generateSecurePassword(), [Validators.required, strongPasswordValidator()]],
  });
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly created = signal<{ email: string; password: string } | null>(null);
  readonly passwordCopied = signal(false);

  // Lista
  readonly rowBusy = signal<string | null>(null);
  readonly rowError = signal<{ id: string; text: string } | null>(null);

  constructor() {
    // Preenche o nome quando o perfil chegar do banco
    effect(() => {
      const profile = this.auth.profile();
      if (profile && !this.nameForm.dirty) {
        this.nameForm.setValue({ fullName: profile.fullName });
      }
    });
    effect(() => {
      if (this.canManage()) {
        this.admin.load();
      }
    });
  }

  levelLabel(level: AccessLevel | null): string {
    return level ? this.levels[level].label : 'Sem nível';
  }

  isSelf(user: SystemUser): boolean {
    return user.id === this.auth.profile()?.id;
  }

  /** Admins e o próprio usuário não são alterados pela lista */
  isLocked(user: SystemUser): boolean {
    return user.level === 'admin' || this.isSelf(user);
  }

  async saveName(): Promise<void> {
    this.nameMessage.set(null);
    if (this.nameForm.invalid) {
      this.nameForm.markAllAsTouched();
      return;
    }
    this.nameSaving.set(true);
    try {
      await this.admin.updateOwnName(this.nameForm.controls.fullName.value);
      this.nameForm.markAsPristine();
      this.nameMessage.set({ ok: true, text: 'Nome atualizado com sucesso.' });
    } catch (error) {
      this.nameMessage.set({ ok: false, text: messageOf(error) });
    } finally {
      this.nameSaving.set(false);
    }
  }

  suggestPassword(): void {
    this.newUserForm.controls.password.setValue(generateSecurePassword());
  }

  async createUser(): Promise<void> {
    this.createError.set('');
    this.created.set(null);
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }
    this.creating.set(true);
    const value = this.newUserForm.getRawValue();
    try {
      await this.admin.createUser(value);
      this.created.set({ email: value.email.trim(), password: value.password });
      this.passwordCopied.set(false);
      this.newUserForm.reset({ fullName: '', email: '', level: 'basico', password: generateSecurePassword() });
    } catch (error) {
      this.createError.set(messageOf(error));
    } finally {
      this.creating.set(false);
    }
  }

  async copyCreatedPassword(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.created()?.password ?? '');
      this.passwordCopied.set(true);
    } catch {
      this.passwordCopied.set(false);
    }
  }

  async changeLevel(user: SystemUser, event: Event): Promise<void> {
    const level = (event.target as HTMLSelectElement).value as AccessLevel;
    await this.runRowAction(user, () => this.admin.updateUser(user.id, { level }));
  }

  async toggleActive(user: SystemUser): Promise<void> {
    await this.runRowAction(user, () => this.admin.updateUser(user.id, { active: !user.active }));
  }

  async deleteUser(user: SystemUser): Promise<void> {
    if (!confirm(`Excluir o usuário ${user.fullName || user.email}? Ele perderá o acesso ao sistema.`)) {
      return;
    }
    await this.runRowAction(user, () => this.admin.deleteUser(user.id));
  }

  private async runRowAction(user: SystemUser, action: () => Promise<void>): Promise<void> {
    this.rowError.set(null);
    this.rowBusy.set(user.id);
    try {
      await action();
    } catch (error) {
      this.rowError.set({ id: user.id, text: messageOf(error) });
      // Volta a lista ao estado do banco (ex.: select que mudou na tela mas não foi salvo)
      await this.admin.load();
    } finally {
      this.rowBusy.set(null);
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Não foi possível concluir.';
}
