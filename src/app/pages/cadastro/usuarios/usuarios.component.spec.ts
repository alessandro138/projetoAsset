import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AccessLevel, SystemUser, levelRank } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { UserAdminService } from '../../../services/user-admin.service';
import { unmetPasswordRules } from '../../../shared/utils/password';
import { UsuariosComponent } from './usuarios.component';

describe('UsuariosComponent', () => {
  const users: SystemUser[] = [
    { id: 'me', fullName: 'Eu Mesmo', email: 'eu@asset.org', level: 'avancado', active: true },
    { id: 'adm', fullName: 'Admin Geral', email: 'admin@asset.org', level: 'admin', active: true },
    { id: 'sec', fullName: 'Secretária', email: 'sec@asset.org', level: 'basico', active: true },
  ];
  let admin: jasmine.SpyObj<UserAdminService> & { users: ReturnType<typeof signal<SystemUser[]>> };

  function create(level: AccessLevel) {
    admin = Object.assign(
      jasmine.createSpyObj<UserAdminService>('UserAdminService', ['load', 'updateOwnName', 'updateUser', 'createUser', 'deleteUser']),
      { users: signal(users), loading: signal(false), loadError: signal('') },
    ) as never;
    admin.load.and.resolveTo();
    admin.createUser.and.resolveTo();
    admin.updateUser.and.resolveTo();
    admin.updateOwnName.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [
        provideRouter([]),
        { provide: UserAdminService, useValue: admin },
        {
          provide: AuthService,
          useValue: {
            email: signal('eu@asset.org'),
            profile: signal({ id: 'me', fullName: 'Eu Mesmo', level, active: true }),
            hasLevel: (minimum: AccessLevel) => levelRank(level) >= levelRank(minimum),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(UsuariosComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows only "Minha conta" to basic and intermediate users', () => {
    const element = create('intermediario').nativeElement as HTMLElement;
    expect(element.textContent).toContain('Minha conta');
    expect(element.textContent).not.toContain('Novo usuário');
    expect(element.textContent).not.toContain('Usuários do sistema');
    expect(admin.load).not.toHaveBeenCalled();
  });

  it('fills the own name and saves it', async () => {
    const component = create('basico').componentInstance;
    expect(component.nameForm.controls.fullName.value).toBe('Eu Mesmo');
    component.nameForm.setValue({ fullName: 'Novo Nome' });
    component.nameForm.markAsDirty();
    await component.saveName();
    expect(admin.updateOwnName).toHaveBeenCalledWith('Novo Nome');
    expect(component.nameMessage()?.ok).toBeTrue();
  });

  it('lets advanced users manage users, but locks admins and themselves', () => {
    const fixture = create('avancado');
    const component = fixture.componentInstance;
    expect(admin.load).toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Usuários do sistema');
    expect(component.isLocked(users[0])).toBeTrue();
    expect(component.isLocked(users[1])).toBeTrue();
    expect(component.isLocked(users[2])).toBeFalse();
    const deleteButtons = (fixture.nativeElement as HTMLElement).querySelectorAll('button.btn-outline-danger');
    expect(deleteButtons.length).toBe(1);
  });

  it('never offers the admin level', () => {
    const component = create('admin').componentInstance;
    expect(component.assignableLevels).not.toContain('admin');
  });

  it('creates a user with a suggested strong password and shows it', async () => {
    const component = create('avancado').componentInstance;
    const password = component.newUserForm.controls.password.value;
    expect(unmetPasswordRules(password)).toEqual([]);

    component.newUserForm.patchValue({ fullName: 'Nova Pessoa', email: 'nova@asset.org', level: 'intermediario' });
    await component.createUser();
    expect(admin.createUser).toHaveBeenCalledWith({
      fullName: 'Nova Pessoa',
      email: 'nova@asset.org',
      level: 'intermediario',
      password,
    });
    expect(component.created()).toEqual({ email: 'nova@asset.org', password });
  });

  it('shows the error when creation fails', async () => {
    const component = create('avancado').componentInstance;
    admin.createUser.and.rejectWith(new Error('Já existe um usuário com este e-mail.'));
    component.newUserForm.patchValue({ fullName: 'Nova Pessoa', email: 'nova@asset.org' });
    await component.createUser();
    expect(component.createError()).toBe('Já existe um usuário com este e-mail.');
    expect(component.created()).toBeNull();
  });
});
