import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  function render(senhaAlterada?: string) {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: signal(false), hasLevel: () => false, email: signal('') } },
      ],
    });
    const fixture = TestBed.createComponent(LoginComponent);
    if (senhaAlterada) {
      fixture.componentRef.setInput('senhaAlterada', senhaAlterada);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the green success message after a password change', () => {
    const alert = render('1').querySelector('.alert-success');
    expect(alert?.textContent).toContain('Senha alterada com sucesso!');
    expect(alert?.textContent).toContain('Entre novamente usando a nova senha.');
  });

  it('does not show the message on a normal login', () => {
    expect(render().querySelector('.alert-success')).toBeNull();
  });
});
