import { PASSWORD_MIN_LENGTH, generateSecurePassword, unmetPasswordRules } from './password';

describe('password utils', () => {
  it('lists the rules a password does not meet', () => {
    expect(unmetPasswordRules('abc').map(r => r.key)).toEqual(['length', 'upper', 'digit', 'symbol']);
    expect(unmetPasswordRules('Asset2026!Seguro')).toEqual([]);
  });

  it('generates passwords that meet every rule', () => {
    for (let i = 0; i < 200; i++) {
      const password = generateSecurePassword();
      expect(password.length).toBe(16);
      expect(unmetPasswordRules(password)).withContext(password).toEqual([]);
    }
  });

  it('never generates passwords shorter than the minimum', () => {
    expect(generateSecurePassword(4).length).toBe(PASSWORD_MIN_LENGTH);
  });

  it('avoids look-alike characters', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSecurePassword()).not.toMatch(/[0O1lI]/);
    }
  });
});
