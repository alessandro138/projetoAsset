-- =====================================================================================
-- projetoAsset – esquema inicial do banco (Supabase / PostgreSQL)
--
-- Como usar: Supabase → SQL Editor → New query → colar este arquivo inteiro → Run.
-- Roda uma única vez num projeto novo (é uma transação: se algo falhar, nada é criado).
--
-- Schemas:
--   public  – tabelas usadas pelo site (expostas na API, SEMPRE com Row Level Security)
--   private – funções internas (não expostas na API)
--
-- Perfis de usuário (tabela user_profiles):
--   admin      – tudo, inclusive gestão de usuários
--   secretaria – cadastro de pessoas, matrículas e ficha de saúde
--   editor     – conteúdo da página principal
--
-- Depois de rodar: crie seu usuário em Authentication → Users e torne-o administrador:
--   update public.user_profiles set role = 'admin', active = true
--   where id = (select id from auth.users where email = 'SEU_EMAIL');
-- =====================================================================================

begin;

create schema if not exists private;
grant usage on schema private to authenticated;

-- -------------------------------------------------------------------------------------
-- Funções auxiliares
-- -------------------------------------------------------------------------------------

-- Mesma regra do validator do Angular: 11 dígitos, sem sequência repetida e dígitos verificadores corretos
create function private.is_valid_cpf(cpf text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  total int;
  rest int;
begin
  if cpf is null or cpf !~ '^\d{11}$' or cpf ~ '^(\d)\1{10}$' then
    return false;
  end if;

  total := 0;
  for i in 1..9 loop
    total := total + substr(cpf, i, 1)::int * (11 - i);
  end loop;
  rest := (total * 10) % 11;
  if rest = 10 then rest := 0; end if;
  if rest <> substr(cpf, 10, 1)::int then
    return false;
  end if;

  total := 0;
  for i in 1..10 loop
    total := total + substr(cpf, i, 1)::int * (12 - i);
  end loop;
  rest := (total * 10) % 11;
  if rest = 10 then rest := 0; end if;
  return rest = substr(cpf, 11, 1)::int;
end;
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -------------------------------------------------------------------------------------
-- Usuários do sistema (quem pode entrar na área restrita)
-- -------------------------------------------------------------------------------------

create table public.user_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        text check (role in ('admin', 'secretaria', 'editor')),
  -- Novos usuários entram inativos e sem perfil até um administrador liberar
  active      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function private.set_updated_at();

-- Usado pelas políticas: o usuário logado está ativo e tem um dos perfis?
create function private.has_role(allowed text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid()
      and p.active
      and p.role = any (allowed)
  );
$$;

grant execute on function private.has_role(text[]) to authenticated;

-- Cria o perfil automaticamente quando alguém é cadastrado no Authentication
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -------------------------------------------------------------------------------------
-- Pessoas: condutores, beneficiários e tutores legais (sem acesso ao sistema)
-- -------------------------------------------------------------------------------------

create table public.people (
  id                     uuid primary key default gen_random_uuid(),
  full_name              text not null check (char_length(trim(full_name)) between 1 and 150),
  cpf                    char(11) not null unique check (private.is_valid_cpf(cpf)),
  birth_date             date not null check (birth_date <= current_date),
  nationality            text,
  birth_city             text,
  birth_state            char(2) check (birth_state ~ '^[A-Z]{2}$'),
  sus_card               char(15) check (sus_card ~ '^\d{15}$'),
  phone                  text check (phone ~ '^\d{10,11}$'),
  address_cep            char(8) check (address_cep ~ '^\d{8}$'),
  address_street         text,
  address_number         text,
  address_complement     text,
  address_district       text,
  address_city           text,
  address_state          char(2) check (address_state ~ '^[A-Z]{2}$'),
  -- Caminho da foto 3x4 no bucket "person-photos" do Storage
  photo_path             text,
  is_conductor           boolean not null default false,
  is_beneficiary         boolean not null default false,
  is_guardian            boolean not null default false,
  guardian_id            uuid references public.people (id) on delete restrict,
  guardian_relationship  text,
  -- Autorização de uso de imagem e voz (beneficiários); null = não respondida
  image_consent          boolean,
  -- Consentimento LGPD (dado pelo responsável, no caso de menores)
  lgpd_consent           boolean not null check (lgpd_consent),
  lgpd_consent_at        timestamptz not null default now(),
  created_by             uuid default auth.uid() references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint people_has_type check (is_conductor or is_beneficiary or is_guardian),
  constraint people_guardian_not_self check (guardian_id <> id)
);

create index people_full_name_idx on public.people (full_name);
create index people_guardian_id_idx on public.people (guardian_id);

comment on table public.people is 'Dados pessoais (LGPD): acesso só para admin e secretaria.';

create trigger people_updated_at
  before update on public.people
  for each row execute function private.set_updated_at();

-- Beneficiário menor de idade precisa de responsável cadastrado e maior de idade
create function private.check_person_guardian()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  guardian_birth date;
begin
  if new.is_beneficiary
     and new.birth_date > current_date - interval '18 years'
     and new.guardian_id is null then
    raise exception 'Beneficiário menor de idade precisa de responsável (tutor legal).';
  end if;

  if new.guardian_id is not null then
    select birth_date into guardian_birth from public.people where id = new.guardian_id;
    if guardian_birth is null then
      raise exception 'Responsável não encontrado.';
    end if;
    if guardian_birth > current_date - interval '18 years' then
      raise exception 'O responsável precisa ser maior de idade.';
    end if;
  end if;

  return new;
end;
$$;

create trigger people_check_guardian
  before insert or update on public.people
  for each row execute function private.check_person_guardian();

-- -------------------------------------------------------------------------------------
-- Matrículas dos beneficiários (uma pessoa pode ter várias ao longo do tempo)
-- -------------------------------------------------------------------------------------

create table public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.people (id) on delete cascade,
  start_date  date not null,
  end_date    date,
  modality    text not null check (char_length(trim(modality)) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint enrollments_end_after_start check (end_date is null or end_date >= start_date)
);

create index enrollments_person_id_idx on public.enrollments (person_id);

create trigger enrollments_updated_at
  before update on public.enrollments
  for each row execute function private.set_updated_at();

-- -------------------------------------------------------------------------------------
-- Ficha de saúde (uma por beneficiário)
-- -------------------------------------------------------------------------------------

create table public.health_records (
  person_id              uuid primary key references public.people (id) on delete cascade,
  ubs_registration       text,
  nearest_health_unit    text,
  has_health_insurance   boolean,
  health_insurance_name  text,
  vaccination            text check (vaccination in ('atualizado', 'atrasado', 'sem-informacao')),
  lives_with             text check (lives_with in ('mae-e-pai', 'pai', 'mae', 'outros')),
  lives_with_other       text,
  birth_type             text check (birth_type in ('normal', 'cesarea', 'forceps', 'prematuro')),
  -- Perguntas Sim/Não (HEALTH_QUESTIONS no Angular): { "allergy": { "answer": true, "details": "Lactose" }, ... }
  answers                jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  updated_by             uuid default auth.uid() references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.health_records is 'Dado pessoal sensível (LGPD, art. 11): acesso só para admin e secretaria.';

create trigger health_records_updated_at
  before update on public.health_records
  for each row execute function private.set_updated_at();

-- -------------------------------------------------------------------------------------
-- Conteúdo da página principal (uma linha; estrutura = SiteContent do Angular)
-- -------------------------------------------------------------------------------------

create table public.site_content (
  id          smallint primary key default 1 check (id = 1),
  content     jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  updated_by  uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);

create trigger site_content_updated_at
  before update on public.site_content
  for each row execute function private.set_updated_at();

-- Conteúdo vazio: o site usa o conteúdo padrão até o administrador salvar o primeiro
insert into public.site_content (id) values (1);

-- -------------------------------------------------------------------------------------
-- Row Level Security: sem política, ninguém acessa
-- -------------------------------------------------------------------------------------

alter table public.user_profiles  enable row level security;
alter table public.people         enable row level security;
alter table public.enrollments    enable row level security;
alter table public.health_records enable row level security;
alter table public.site_content   enable row level security;

-- Visitantes não autenticados nunca tocam em dados pessoais (proteção extra além das políticas)
revoke all on public.user_profiles, public.people, public.enrollments, public.health_records from anon;
revoke insert, update, delete on public.site_content from anon;

-- user_profiles: cada um vê o próprio perfil; só admin vê todos e altera (ninguém promove a si mesmo)
create policy "Perfis: ver o próprio ou admin vê todos"
  on public.user_profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.has_role(array['admin'])));

create policy "Perfis: admin altera"
  on public.user_profiles for update to authenticated
  using ((select private.has_role(array['admin'])))
  with check ((select private.has_role(array['admin'])));

create policy "Perfis: admin exclui"
  on public.user_profiles for delete to authenticated
  using ((select private.has_role(array['admin'])));

-- people: admin e secretaria leem, criam e alteram; só admin exclui
create policy "Pessoas: equipe de cadastro lê"
  on public.people for select to authenticated
  using ((select private.has_role(array['admin', 'secretaria'])));

create policy "Pessoas: equipe de cadastro cria"
  on public.people for insert to authenticated
  with check ((select private.has_role(array['admin', 'secretaria'])));

create policy "Pessoas: equipe de cadastro altera"
  on public.people for update to authenticated
  using ((select private.has_role(array['admin', 'secretaria'])))
  with check ((select private.has_role(array['admin', 'secretaria'])));

create policy "Pessoas: admin exclui"
  on public.people for delete to authenticated
  using ((select private.has_role(array['admin'])));

-- enrollments: mesmas regras de people
create policy "Matrículas: equipe de cadastro lê"
  on public.enrollments for select to authenticated
  using ((select private.has_role(array['admin', 'secretaria'])));

create policy "Matrículas: equipe de cadastro cria"
  on public.enrollments for insert to authenticated
  with check ((select private.has_role(array['admin', 'secretaria'])));

create policy "Matrículas: equipe de cadastro altera"
  on public.enrollments for update to authenticated
  using ((select private.has_role(array['admin', 'secretaria'])))
  with check ((select private.has_role(array['admin', 'secretaria'])));

create policy "Matrículas: admin exclui"
  on public.enrollments for delete to authenticated
  using ((select private.has_role(array['admin'])));

-- health_records: mesmas regras de people (editor nunca vê dados de saúde)
create policy "Saúde: equipe de cadastro lê"
  on public.health_records for select to authenticated
  using ((select private.has_role(array['admin', 'secretaria'])));

create policy "Saúde: equipe de cadastro cria"
  on public.health_records for insert to authenticated
  with check ((select private.has_role(array['admin', 'secretaria'])));

create policy "Saúde: equipe de cadastro altera"
  on public.health_records for update to authenticated
  using ((select private.has_role(array['admin', 'secretaria'])))
  with check ((select private.has_role(array['admin', 'secretaria'])));

create policy "Saúde: admin exclui"
  on public.health_records for delete to authenticated
  using ((select private.has_role(array['admin'])));

-- site_content: qualquer visitante lê (é o site público); admin e editor alteram
create policy "Conteúdo do site: leitura pública"
  on public.site_content for select to anon, authenticated
  using (true);

create policy "Conteúdo do site: admin e editor alteram"
  on public.site_content for update to authenticated
  using ((select private.has_role(array['admin', 'editor'])))
  with check ((select private.has_role(array['admin', 'editor'])));

-- -------------------------------------------------------------------------------------
-- Storage: fotos 3x4 (bucket privado; máx. 2 MB; só imagens)
-- -------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('person-photos', 'person-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Fotos: equipe de cadastro lê"
  on storage.objects for select to authenticated
  using (bucket_id = 'person-photos' and (select private.has_role(array['admin', 'secretaria'])));

create policy "Fotos: equipe de cadastro envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'person-photos' and (select private.has_role(array['admin', 'secretaria'])));

create policy "Fotos: equipe de cadastro substitui"
  on storage.objects for update to authenticated
  using (bucket_id = 'person-photos' and (select private.has_role(array['admin', 'secretaria'])));

create policy "Fotos: equipe de cadastro exclui"
  on storage.objects for delete to authenticated
  using (bucket_id = 'person-photos' and (select private.has_role(array['admin', 'secretaria'])));

commit;
