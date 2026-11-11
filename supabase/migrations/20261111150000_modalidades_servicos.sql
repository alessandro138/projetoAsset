-- =====================================================================================
-- projetoAsset – modalidades oferecidas pela ASSET
--
-- Rodar DEPOIS de 20261111120000_initial_schema.sql:
-- Supabase → SQL Editor → New query → colar este arquivo inteiro → Run (uma única vez).
--
-- Cria a tabela modalidades_servicos (lista usada no campo "Modalidade" do cadastro)
-- e troca o texto livre matriculas.modalidade por uma referência a ela.
-- Modalidades digitadas antes desta mudança são preservadas como inativas.
-- =====================================================================================

begin;

create table public.modalidades_servicos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null unique check (char_length(trim(nome)) between 1 and 100),
  -- Inativas não aparecem para novas matrículas, mas continuam nas matrículas antigas
  ativo          boolean not null default true,
  -- Posição na lista do formulário
  ordem          smallint not null default 0,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create trigger modalidades_servicos_atualizado_em
  before update on public.modalidades_servicos
  for each row execute function privado.definir_atualizado_em();

insert into public.modalidades_servicos (nome, ordem) values
  ('Jiu-jítsu', 1),
  ('Kickboxing', 2),
  ('Zumba', 3),
  ('Mulher em foco', 4),
  ('Rede cozinha escola', 5),
  ('Informática', 6),
  ('Ballet', 7);

-- -------------------------------------------------------------------------------------
-- Matrículas passam a apontar para a modalidade
-- -------------------------------------------------------------------------------------

-- Preserva modalidades já digitadas que não estão na lista (ficam inativas)
insert into public.modalidades_servicos (nome, ativo, ordem)
select distinct trim(m.modalidade), false, 999
from public.matriculas m
where not exists (
  select 1 from public.modalidades_servicos s where lower(s.nome) = lower(trim(m.modalidade))
);

alter table public.matriculas
  add column modalidade_servico_id uuid references public.modalidades_servicos (id) on delete restrict;

update public.matriculas m
set modalidade_servico_id = s.id
from public.modalidades_servicos s
where lower(s.nome) = lower(trim(m.modalidade));

alter table public.matriculas alter column modalidade_servico_id set not null;
alter table public.matriculas drop column modalidade;

create index matriculas_modalidade_servico_id_idx on public.matriculas (modalidade_servico_id);

-- -------------------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------------------

alter table public.modalidades_servicos enable row level security;
revoke insert, update, delete on public.modalidades_servicos from anon;

-- Leitura pública: são as atividades oferecidas (podem aparecer no site)
create policy "Modalidades: leitura pública"
  on public.modalidades_servicos for select to anon, authenticated
  using (true);

create policy "Modalidades: admin cria"
  on public.modalidades_servicos for insert to authenticated
  with check ((select privado.tem_perfil(array['admin'])));

create policy "Modalidades: admin altera"
  on public.modalidades_servicos for update to authenticated
  using ((select privado.tem_perfil(array['admin'])))
  with check ((select privado.tem_perfil(array['admin'])));

create policy "Modalidades: admin exclui"
  on public.modalidades_servicos for delete to authenticated
  using ((select privado.tem_perfil(array['admin'])));

commit;
