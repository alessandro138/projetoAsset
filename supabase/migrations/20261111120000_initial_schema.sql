-- =====================================================================================
-- projetoAsset – esquema inicial do banco (Supabase / PostgreSQL)
--
-- Como usar: Supabase → SQL Editor → New query → colar este arquivo inteiro → Run.
-- Roda uma única vez num projeto novo (é uma transação: se algo falhar, nada é criado).
--
-- Nomes em português, snake_case e sem acentos (não exigem aspas no SQL).
--
-- Schemas:
--   public  – tabelas usadas pelo site (expostas na API, SEMPRE com Row Level Security)
--   privado – funções internas (não expostas na API)
--
-- Perfis de usuário (tabela perfis_usuarios):
--   admin      – tudo, inclusive gestão de usuários
--   secretaria – cadastro de pessoas, matrículas e ficha de saúde
--   editor     – conteúdo da página principal
--
-- Depois de rodar: crie seu usuário em Authentication → Users e torne-o administrador:
--   update public.perfis_usuarios set perfil = 'admin', ativo = true
--   where id = (select id from auth.users where email = 'SEU_EMAIL');
-- =====================================================================================

begin;

create schema if not exists privado;
grant usage on schema privado to authenticated;

-- -------------------------------------------------------------------------------------
-- Funções auxiliares
-- -------------------------------------------------------------------------------------

-- Mesma regra do validator do Angular: 11 dígitos, sem sequência repetida e dígitos verificadores corretos
create function privado.cpf_valido(cpf text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  soma int;
  resto int;
begin
  if cpf is null or cpf !~ '^\d{11}$' or cpf ~ '^(\d)\1{10}$' then
    return false;
  end if;

  soma := 0;
  for i in 1..9 loop
    soma := soma + substr(cpf, i, 1)::int * (11 - i);
  end loop;
  resto := (soma * 10) % 11;
  if resto = 10 then resto := 0; end if;
  if resto <> substr(cpf, 10, 1)::int then
    return false;
  end if;

  soma := 0;
  for i in 1..10 loop
    soma := soma + substr(cpf, i, 1)::int * (12 - i);
  end loop;
  resto := (soma * 10) % 11;
  if resto = 10 then resto := 0; end if;
  return resto = substr(cpf, 11, 1)::int;
end;
$$;

create function privado.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- -------------------------------------------------------------------------------------
-- Usuários do sistema (quem pode entrar na área restrita)
-- -------------------------------------------------------------------------------------

create table public.perfis_usuarios (
  id             uuid primary key references auth.users (id) on delete cascade,
  nome_completo  text not null default '',
  perfil         text check (perfil in ('admin', 'secretaria', 'editor')),
  -- Novos usuários entram inativos e sem perfil até um administrador liberar
  ativo          boolean not null default false,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create trigger perfis_usuarios_atualizado_em
  before update on public.perfis_usuarios
  for each row execute function privado.definir_atualizado_em();

-- Usado pelas políticas: o usuário logado está ativo e tem um dos perfis?
create function privado.tem_perfil(permitidos text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis_usuarios p
    where p.id = auth.uid()
      and p.ativo
      and p.perfil = any (permitidos)
  );
$$;

grant execute on function privado.tem_perfil(text[]) to authenticated;

-- Cria o perfil automaticamente quando alguém é cadastrado no Authentication
create function privado.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis_usuarios (id, nome_completo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger ao_criar_usuario_auth
  after insert on auth.users
  for each row execute function privado.criar_perfil_usuario();

-- -------------------------------------------------------------------------------------
-- Pessoas: condutores, beneficiários e tutores legais (sem acesso ao sistema)
-- -------------------------------------------------------------------------------------

create table public.pessoas (
  id                     uuid primary key default gen_random_uuid(),
  nome_completo          text not null check (char_length(trim(nome_completo)) between 1 and 150),
  cpf                    char(11) not null unique check (privado.cpf_valido(cpf)),
  data_nascimento        date not null check (data_nascimento <= current_date),
  naturalidade           text,
  cidade_nascimento      text,
  uf_nascimento          char(2) check (uf_nascimento ~ '^[A-Z]{2}$'),
  cartao_sus             char(15) check (cartao_sus ~ '^\d{15}$'),
  celular                text check (celular ~ '^\d{10,11}$'),
  endereco_cep           char(8) check (endereco_cep ~ '^\d{8}$'),
  endereco_logradouro    text,
  endereco_numero        text,
  endereco_complemento   text,
  endereco_bairro        text,
  endereco_cidade        text,
  endereco_uf            char(2) check (endereco_uf ~ '^[A-Z]{2}$'),
  -- Caminho da foto 3x4 no bucket "fotos-pessoas" do Storage
  foto_caminho           text,
  eh_condutor            boolean not null default false,
  eh_beneficiario        boolean not null default false,
  eh_tutor               boolean not null default false,
  responsavel_id         uuid references public.pessoas (id) on delete restrict,
  grau_parentesco        text,
  -- Autorização de uso de imagem e voz (beneficiários); null = não respondida
  autoriza_imagem        boolean,
  -- Consentimento LGPD (dado pelo responsável, no caso de menores)
  consentimento_lgpd     boolean not null check (consentimento_lgpd),
  consentimento_lgpd_em  timestamptz not null default now(),
  criado_por             uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now(),

  constraint pessoas_tem_tipo check (eh_condutor or eh_beneficiario or eh_tutor),
  constraint pessoas_responsavel_nao_e_a_propria check (responsavel_id <> id)
);

create index pessoas_nome_completo_idx on public.pessoas (nome_completo);
create index pessoas_responsavel_id_idx on public.pessoas (responsavel_id);

comment on table public.pessoas is 'Dados pessoais (LGPD): acesso só para admin e secretaria.';

create trigger pessoas_atualizado_em
  before update on public.pessoas
  for each row execute function privado.definir_atualizado_em();

-- Beneficiário menor de idade precisa de responsável cadastrado e maior de idade
create function privado.validar_responsavel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nascimento_responsavel date;
begin
  if new.eh_beneficiario
     and new.data_nascimento > current_date - interval '18 years'
     and new.responsavel_id is null then
    raise exception 'Beneficiário menor de idade precisa de responsável (tutor legal).';
  end if;

  if new.responsavel_id is not null then
    select data_nascimento into nascimento_responsavel from public.pessoas where id = new.responsavel_id;
    if nascimento_responsavel is null then
      raise exception 'Responsável não encontrado.';
    end if;
    if nascimento_responsavel > current_date - interval '18 years' then
      raise exception 'O responsável precisa ser maior de idade.';
    end if;
  end if;

  return new;
end;
$$;

create trigger pessoas_validar_responsavel
  before insert or update on public.pessoas
  for each row execute function privado.validar_responsavel();

-- -------------------------------------------------------------------------------------
-- Matrículas dos beneficiários (uma pessoa pode ter várias ao longo do tempo)
-- -------------------------------------------------------------------------------------

create table public.matriculas (
  id             uuid primary key default gen_random_uuid(),
  pessoa_id      uuid not null references public.pessoas (id) on delete cascade,
  data_inicio    date not null,
  data_termino   date,
  modalidade     text not null check (char_length(trim(modalidade)) between 1 and 100),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),

  constraint matriculas_termino_apos_inicio check (data_termino is null or data_termino >= data_inicio)
);

create index matriculas_pessoa_id_idx on public.matriculas (pessoa_id);

create trigger matriculas_atualizado_em
  before update on public.matriculas
  for each row execute function privado.definir_atualizado_em();

-- -------------------------------------------------------------------------------------
-- Ficha de saúde (uma por beneficiário)
-- -------------------------------------------------------------------------------------

create table public.fichas_saude (
  pessoa_id              uuid primary key references public.pessoas (id) on delete cascade,
  matricula_ubs          text,
  unidade_saude_proxima  text,
  possui_convenio        boolean,
  nome_convenio          text,
  calendario_vacinal     text check (calendario_vacinal in ('atualizado', 'atrasado', 'sem-informacao')),
  vive_com               text check (vive_com in ('mae-e-pai', 'pai', 'mae', 'outros')),
  vive_com_outros        text,
  tipo_parto             text check (tipo_parto in ('normal', 'cesarea', 'forceps', 'prematuro')),
  -- Perguntas Sim/Não (HEALTH_QUESTIONS no Angular): { "allergy": { "answer": true, "details": "Lactose" }, ... }
  respostas              jsonb not null default '{}'::jsonb check (jsonb_typeof(respostas) = 'object'),
  atualizado_por         uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);

comment on table public.fichas_saude is 'Dado pessoal sensível (LGPD, art. 11): acesso só para admin e secretaria.';

create trigger fichas_saude_atualizado_em
  before update on public.fichas_saude
  for each row execute function privado.definir_atualizado_em();

-- -------------------------------------------------------------------------------------
-- Conteúdo da página principal (uma linha; estrutura = SiteContent do Angular)
-- -------------------------------------------------------------------------------------

create table public.conteudo_site (
  id              smallint primary key default 1 check (id = 1),
  conteudo        jsonb not null default '{}'::jsonb check (jsonb_typeof(conteudo) = 'object'),
  atualizado_por  uuid default auth.uid() references auth.users (id) on delete set null,
  atualizado_em   timestamptz not null default now()
);

create trigger conteudo_site_atualizado_em
  before update on public.conteudo_site
  for each row execute function privado.definir_atualizado_em();

-- Conteúdo vazio: o site usa o conteúdo padrão até o administrador salvar o primeiro
insert into public.conteudo_site (id) values (1);

-- -------------------------------------------------------------------------------------
-- Row Level Security: sem política, ninguém acessa
-- -------------------------------------------------------------------------------------

alter table public.perfis_usuarios enable row level security;
alter table public.pessoas         enable row level security;
alter table public.matriculas      enable row level security;
alter table public.fichas_saude    enable row level security;
alter table public.conteudo_site   enable row level security;

-- Visitantes não autenticados nunca tocam em dados pessoais (proteção extra além das políticas)
revoke all on public.perfis_usuarios, public.pessoas, public.matriculas, public.fichas_saude from anon;
revoke insert, update, delete on public.conteudo_site from anon;

-- perfis_usuarios: cada um vê o próprio perfil; só admin vê todos e altera (ninguém promove a si mesmo)
create policy "Perfis: ver o próprio ou admin vê todos"
  on public.perfis_usuarios for select to authenticated
  using (id = (select auth.uid()) or (select privado.tem_perfil(array['admin'])));

create policy "Perfis: admin altera"
  on public.perfis_usuarios for update to authenticated
  using ((select privado.tem_perfil(array['admin'])))
  with check ((select privado.tem_perfil(array['admin'])));

create policy "Perfis: admin exclui"
  on public.perfis_usuarios for delete to authenticated
  using ((select privado.tem_perfil(array['admin'])));

-- pessoas: admin e secretaria leem, criam e alteram; só admin exclui
create policy "Pessoas: equipe de cadastro lê"
  on public.pessoas for select to authenticated
  using ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Pessoas: equipe de cadastro cria"
  on public.pessoas for insert to authenticated
  with check ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Pessoas: equipe de cadastro altera"
  on public.pessoas for update to authenticated
  using ((select privado.tem_perfil(array['admin', 'secretaria'])))
  with check ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Pessoas: admin exclui"
  on public.pessoas for delete to authenticated
  using ((select privado.tem_perfil(array['admin'])));

-- matriculas: mesmas regras de pessoas
create policy "Matrículas: equipe de cadastro lê"
  on public.matriculas for select to authenticated
  using ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Matrículas: equipe de cadastro cria"
  on public.matriculas for insert to authenticated
  with check ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Matrículas: equipe de cadastro altera"
  on public.matriculas for update to authenticated
  using ((select privado.tem_perfil(array['admin', 'secretaria'])))
  with check ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Matrículas: admin exclui"
  on public.matriculas for delete to authenticated
  using ((select privado.tem_perfil(array['admin'])));

-- fichas_saude: mesmas regras de pessoas (editor nunca vê dados de saúde)
create policy "Saúde: equipe de cadastro lê"
  on public.fichas_saude for select to authenticated
  using ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Saúde: equipe de cadastro cria"
  on public.fichas_saude for insert to authenticated
  with check ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Saúde: equipe de cadastro altera"
  on public.fichas_saude for update to authenticated
  using ((select privado.tem_perfil(array['admin', 'secretaria'])))
  with check ((select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Saúde: admin exclui"
  on public.fichas_saude for delete to authenticated
  using ((select privado.tem_perfil(array['admin'])));

-- conteudo_site: qualquer visitante lê (é o site público); admin e editor alteram
create policy "Conteúdo do site: leitura pública"
  on public.conteudo_site for select to anon, authenticated
  using (true);

create policy "Conteúdo do site: admin e editor alteram"
  on public.conteudo_site for update to authenticated
  using ((select privado.tem_perfil(array['admin', 'editor'])))
  with check ((select privado.tem_perfil(array['admin', 'editor'])));

-- -------------------------------------------------------------------------------------
-- Storage: fotos 3x4 (bucket privado; máx. 2 MB; só imagens)
-- -------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-pessoas', 'fotos-pessoas', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Fotos: equipe de cadastro lê"
  on storage.objects for select to authenticated
  using (bucket_id = 'fotos-pessoas' and (select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Fotos: equipe de cadastro envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-pessoas' and (select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Fotos: equipe de cadastro substitui"
  on storage.objects for update to authenticated
  using (bucket_id = 'fotos-pessoas' and (select privado.tem_perfil(array['admin', 'secretaria'])));

create policy "Fotos: equipe de cadastro exclui"
  on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-pessoas' and (select privado.tem_perfil(array['admin', 'secretaria'])));

commit;
