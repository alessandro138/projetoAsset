import { Person, emptyHealthRecord } from '../models/person.model';
import { PessoaRow, fromRows, toFichaSaudeInput, toMatriculaInput, toPessoaInput } from './person.mapper';

describe('person.mapper', () => {
  const person: Omit<Person, 'id'> = {
    fullName: '  Ana Souza ',
    cpf: '52998224725',
    rg: '',
    birthDate: '2023-03-05',
    nationality: 'Brasileira',
    birthCity: '',
    birthState: 'SP',
    susCard: '898001160409346',
    phone: '',
    address: { cep: '02879080', street: 'Rua A', number: '1', complement: '', district: '', city: 'São Paulo', state: 'SP' },
    photo: '',
    types: ['beneficiario'],
    guardianId: 'g1',
    guardianRelationship: 'Mãe',
    enrollment: { startDate: '2026-02-01', endDate: '', modalityId: 'm1', modality: 'Zumba' },
    health: {
      ...emptyHealthRecord(),
      hasHealthInsurance: false,
      healthInsuranceName: 'ignorado',
      vaccination: 'atualizado',
      answers: { ...emptyHealthRecord().answers, allergy: { answer: true, details: 'Lactose' } },
    },
    imageConsent: true,
    consentGiven: true,
  };

  it('maps the person to database columns, turning empty strings into null', () => {
    const row = toPessoaInput(person);
    expect(row.nome_completo).toBe('Ana Souza');
    expect(row.cidade_nascimento).toBeNull();
    expect(row.celular).toBeNull();
    expect(row.endereco_cep).toBe('02879080');
    expect(row.eh_beneficiario).toBeTrue();
    expect(row.eh_condutor).toBeFalse();
    expect(row.responsavel_id).toBe('g1');
    expect(row.grau_parentesco).toBe('Mãe');
  });

  it('maps enrollment and health record', () => {
    expect(toMatriculaInput(person.enrollment!)).toEqual({ data_inicio: '2026-02-01', data_termino: null, modalidade_servico_id: 'm1' });
    const ficha = toFichaSaudeInput(person.health!);
    expect(ficha.possui_convenio).toBeFalse();
    expect(ficha.nome_convenio).toBeNull();
    expect(ficha.calendario_vacinal).toBe('atualizado');
    expect(ficha.respostas.allergy).toEqual({ answer: true, details: 'Lactose' });
  });

  it('rebuilds the person from database rows (round trip)', () => {
    const row: PessoaRow = {
      id: 'p1',
      foto_caminho: 'p1/foto.jpg',
      criado_em: '2026-11-18T13:00:00+00:00',
      desativado_em: null,
      ...toPessoaInput(person),
    };
    const rebuilt = fromRows(
      row,
      { id: 'e1', pessoa_id: 'p1', ...toMatriculaInput(person.enrollment!), modalidades_servicos: { nome: 'Zumba' } },
      { pessoa_id: 'p1', ...toFichaSaudeInput(person.health!), respostas: { allergy: { answer: true, details: 'Lactose' } } },
      'https://foto',
    );
    expect(rebuilt.id).toBe('p1');
    expect(rebuilt.fullName).toBe('Ana Souza');
    expect(rebuilt.birthCity).toBe('');
    expect(rebuilt.types).toEqual(['beneficiario']);
    expect(rebuilt.photo).toBe('https://foto');
    expect(rebuilt.createdAt).toBe('2026-11-18T13:00:00+00:00');
    expect(rebuilt.deactivatedAt).toBeNull();
    expect(rebuilt.enrollment).toEqual({ startDate: '2026-02-01', endDate: '', modalityId: 'm1', modality: 'Zumba' });
    expect(rebuilt.health?.answers.allergy).toEqual({ answer: true, details: 'Lactose' });
    // Perguntas ausentes no banco voltam em branco
    expect(rebuilt.health?.answers.fracture).toEqual({ answer: null, details: '' });
  });
});
