export const AGE_OF_MAJORITY = 18;

/** Converte 'AAAA-MM-DD' (valor de input type="date") em data local, sem deslocamento de fuso. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) {
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(date.getTime()) ? null : date;
}

/** 'AAAA-MM-DD' → 'DD/MM/AAAA'; vazio se a data for inválida */
export function formatIsoDate(value: string | null | undefined): string {
  const date = parseIsoDate(value);
  if (!date) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Data/hora ISO do banco (ex.: '2026-11-18T13:45:00+00:00') → 'DD/MM/AAAA' no fuso local; vazio se inválida */
export function formatTimestampDate(value: string | null | undefined): string {
  const date = value ? new Date(value) : null;
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function ageOn(birthDate: string, today: Date = new Date()): number | null {
  const birth = parseIsoDate(birthDate);
  if (!birth) {
    return null;
  }
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) {
    age--;
  }
  return age;
}

export function isMinor(birthDate: string, today: Date = new Date()): boolean {
  const age = ageOn(birthDate, today);
  return age !== null && age < AGE_OF_MAJORITY;
}
