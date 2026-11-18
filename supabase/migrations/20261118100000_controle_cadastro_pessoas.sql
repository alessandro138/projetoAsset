-- =====================================================================================
-- Controle do cadastro de pessoas: quem cadastrou e desativação do cadastro
-- Rodar no SQL Editor do Supabase depois das migrações anteriores.
--
-- - criado_por / criado_em: já existiam; agora o banco grava sempre o usuário logado e a
--   hora do servidor e ignora o que o sistema mandar (ninguém consegue forjar ou alterar).
-- - criado_por_email / desativado_por_email: cópia do e-mail no momento da ação, para o
--   controle continuar legível mesmo depois que o usuário for excluído (aí o id vira null).
-- - desativado_em / desativado_por: cadastro desativado (não aparece na listagem por padrão).
--   Para desativar, o sistema grava qualquer valor em desativado_em; o gatilho troca pela
--   hora do servidor e pelo usuário logado. Gravar null reativa (por enquanto só pelo banco).
-- =====================================================================================

begin;

alter table public.pessoas
  add column criado_por_email      text,
  add column desativado_em         timestamptz,
  add column desativado_por        uuid references auth.users (id) on delete set null,
  add column desativado_por_email  text;

comment on column public.pessoas.criado_por is 'Usuário que cadastrou (gravado pelo banco; controle interno)';
comment on column public.pessoas.criado_por_email is 'E-mail de quem cadastrou, no momento do cadastro';
comment on column public.pessoas.desativado_em is 'Data/hora da desativação do cadastro; null = ativo';
comment on column public.pessoas.desativado_por is 'Usuário que desativou o cadastro';
comment on column public.pessoas.desativado_por_email is 'E-mail de quem desativou, no momento da desativação';

-- Cadastros antigos: preenche o e-mail de quem cadastrou, quando conhecido
update public.pessoas p
   set criado_por_email = u.email
  from auth.users u
 where u.id = p.criado_por
   and p.criado_por_email is null;

create index pessoas_desativado_em_idx on public.pessoas (desativado_em);

-- E-mail do usuário logado (vem do token de acesso; null no SQL Editor)
create function privado.email_usuario_atual()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'email', '');
$$;

create function privado.controlar_cadastro_pessoas()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_por := auth.uid();
    new.criado_por_email := privado.email_usuario_atual();
    new.criado_em := now();
    new.desativado_em := null;
    new.desativado_por := null;
    new.desativado_por_email := null;
    return new;
  end if;

  -- Quem cadastrou e quando nunca mudam
  new.criado_por := old.criado_por;
  new.criado_por_email := old.criado_por_email;
  new.criado_em := old.criado_em;

  if old.desativado_em is null and new.desativado_em is not null then
    -- Desativação: hora do servidor e usuário logado
    new.desativado_em := now();
    new.desativado_por := auth.uid();
    new.desativado_por_email := privado.email_usuario_atual();
  elsif old.desativado_em is not null and new.desativado_em is null then
    -- Reativação
    new.desativado_por := null;
    new.desativado_por_email := null;
  else
    -- Sem mudança de situação: mantém os dados da desativação
    new.desativado_em := old.desativado_em;
    new.desativado_por := old.desativado_por;
    new.desativado_por_email := old.desativado_por_email;
  end if;
  return new;
end;
$$;

create trigger pessoas_controlar_cadastro
  before insert or update on public.pessoas
  for each row execute function privado.controlar_cadastro_pessoas();

commit;
