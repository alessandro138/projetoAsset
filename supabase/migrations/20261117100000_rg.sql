-- =====================================================================================
-- RG no cadastro de pessoas; CPF deixa de ser obrigatório
-- Regra: toda pessoa precisa ter ao menos um dos dois documentos (CPF ou RG).
-- Rodar no SQL Editor do Supabase depois das migrações anteriores.
-- =====================================================================================

-- Mesma regra do validator do Angular: até 12 caracteres, só dígitos; o último pode ser "X"
-- (dígito verificador de alguns estados, ex.: SP). Gravado sem pontos e traço.
create function privado.rg_valido(rg text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select rg ~ '^[0-9]{4,11}[0-9X]$';
$$;

alter table public.pessoas
  add column rg varchar(12) check (privado.rg_valido(rg));

-- CPF opcional: continua único e validado quando preenchido (o unique aceita vários nulos)
alter table public.pessoas
  alter column cpf drop not null;

alter table public.pessoas
  drop constraint pessoas_cpf_check;

alter table public.pessoas
  add constraint pessoas_cpf_check check (cpf is null or privado.cpf_valido(cpf));

alter table public.pessoas
  add constraint pessoas_tem_documento check (cpf is not null or rg is not null);

comment on column public.pessoas.rg is 'RG sem pontos e traço (até 12 caracteres; o último pode ser X)';
