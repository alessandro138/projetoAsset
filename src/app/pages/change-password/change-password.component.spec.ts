import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { PersonService } from '../../services/person.service';
import { InMemoryPersonService } from '../../testing/in-memory-person.service';
import { unmetPasswordRules } from '../../shared/utils/password';
import { ChangePasswordComponent } from './change-password.component';

describe('ChangePasswordComponent', () => {
  let changePassword: jasmine.Spy;
  let signOut: jasmine.Spy;

  function create() {
    changePassword = jasmine.createSpy('changePassword').and.resolveTo(null);
    signOut = jasmine.createSpy('signOut').and.resolveTo(undefined);
    TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: AuthService,
          useValue: {
            email: signal('secretaria@asset.org'),
            mustChangePassword: signal(true),
            changePassword,
            signOut,
          },
        },
        { provide: PersonService, useClass: InMemoryPersonService },
      ],
    });
    const fixture = TestBed.createComponent(ChangePasswordComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('suggests a strong password and fills both fields with it', () => {
    const component = create();
    component.suggest();
    const suggestion = component.suggestion();
    expect(unmetPasswordRules(suggestion)).toEqual([]);

    component.useSuggestion();
    expect(component.form.getRawValue()).toEqual({ password: suggestion, confirmPassword: suggestion });
    expect(component.form.valid).toBeTrue();
  });

  it('rejects weak or mismatched passwords without calling the server', async () => {
    const component = create();
    component.form.setValue({ password: 'fraca', confirmPassword: 'fraca' });
    await component.submit();
    expect(component.form.controls.password.hasError('weakPassword')).toBeTrue();

    component.form.setValue({ password: 'Asset2026!Seguro', confirmPassword: 'Asset2026!Outra' });
    await component.submit();
    expect(component.form.hasError('passwordMismatch')).toBeTrue();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('changes the password, signs out and asks to log in again', async () => {
    const component = create();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component.form.setValue({ password: 'Asset2026!Seguro', confirmPassword: 'Asset2026!Seguro' });
    await component.submit();
    expect(changePassword).toHaveBeenCalledWith('Asset2026!Seguro');
    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { senhaAlterada: 1, voltar: null } });
  });

  it('shows the error returned by the server', async () => {
    const component = create();
    changePassword.and.resolveTo('A nova senha precisa ser diferente da senha atual.');
    component.form.setValue({ password: 'Asset2026!Seguro', confirmPassword: 'Asset2026!Seguro' });
    await component.submit();
    expect(component.error()).toBe('A nova senha precisa ser diferente da senha atual.');
    expect(signOut).not.toHaveBeenCalled();
  });
});
