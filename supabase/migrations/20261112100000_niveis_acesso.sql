-- =====================================================================================
-- projetoAsset – níveis de acesso dos usuários
--
-- Rodar DEPOIS dos scripts anteriores (initial_schema e modalidades_servicos):
-- Supabase → SQL Editor → New query → colar este arquivo inteiro → Run (uma única vez).
--
-- Níveis (cada um inclui os poderes dos anteriores):
--   basico        – cadastro de beneficiários (pessoas, matrículas, ficha de saúde, fotos)
--   intermediario – + conteúdo do site (template)
--   avancado      – + adicionar, alterar e excluir usuários (exceto admins)
--   admin         – tudo; SÓ pode ser criado aqui no banco (SQL Editor), nunca pelo sistema
--
-- Perfis antigos: admin continua admin; secretaria vira basico; editor vira intermediario.
--
-- Para criar um admin (depois de criar o usuário em Authentication → Users):
--   update public.perfis_usuarios set perfil = 'admin', ativo = true
--   where id = (select id from auth.users where email = 'EMAIL');
-- =====================================================================================

begin;

-- -------------------------------------------------------------------------------------
-- Novos níveis
-- -------------------------------------------------------------------------------------

alter table public.perfis_usuarios drop constraint perfis_usuarios_perfil_check;

update public.perfis_usuarios
set perfil = case perfil when 'secretaria' then 'basico' when 'editor' then 'intermediario' else perfil end;

alter table public.perfis_usuarios
  add constraint perfis_usuarios_perfil_check check (perfil in ('basico', 'intermediario', 'avancado', 'admin'));

-- E-mail no perfil, para a lista de usuários (auth.users não é acessível pelo site)
alter table public.perfis_usuarios add column email text;
update public.perfis_usuarios p set email = u.email from auth.users u where u.id = p.id;

create or replace function privado.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis_usuarios (id, nome_completo, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);
  return new;
end;
$$;

create function privado.valor_nivel(perfil text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case perfil
    when 'basico' then 1
    when 'intermediario' then 2
    when 'avancado' then 3
    when 'admin' then 4
    else 0
  end;
$$;

-- O usuário logado está ativo e tem pelo menos o nível informado?
create function privado.tem_nivel(minimo text)
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
      and privado.valor_nivel(p.perfil) >= privado.valor_nivel(minimo)
  );
$$;

grant execute on function privado.valor_nivel(text) to authenticated;
grant execute on function privado.tem_nivel(text) to authenticated;

-- Regras que valem para quem altera pelo sistema (auth.uid() preenchido).
-- O SQL Editor e a Edge Function (chave secreta) não têm auth.uid() e não passam por aqui;
-- a Edge Function aplica as mesmas regras no próprio código.
create function privado.proteger_perfis()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.perfil = 'admin' and old.perfil is distinct from 'admin' then
    raise exception 'O nível admin só pode ser definido direto no banco de dados.';
  end if;
  if old.perfil = 'admin' and (new.perfil is distinct from old.perfil or new.ativo is distinct from old.ativo) then
    raise exception 'Usuários admin só podem ser alterados direto no banco de dados.';
  end if;
  if new.id = auth.uid() and (new.perfil is distinct from old.perfil or new.ativo is distinct from old.ativo) then
    raise exception 'Você não pode alterar o próprio nível de acesso nem desativar a si mesmo.';
  end if;
  if new.email is distinct from old.email then
    raise exception 'O e-mail não pode ser alterado por aqui.';
  end if;
  return new;
end;
$$;

create trigger perfis_usuarios_proteger
  before update on public.perfis_usuarios
  for each row execute function privado.proteger_perfis();

-- -------------------------------------------------------------------------------------
-- Políticas refeitas com os níveis
-- -------------------------------------------------------------------------------------

drop policy "Perfis: ver o próprio ou admin vê todos" on public.perfis_usuarios;
drop policy "Perfis: admin altera" on public.perfis_usuarios;
drop policy "Perfis: admin exclui" on public.perfis_usuarios;

create policy "Perfis: ver o próprio ou avançado vê todos"
  on public.perfis_usuarios for select to authenticated
  using (id = (select auth.uid()) or (select privado.tem_nivel('avancado')));

-- O próprio usuário altera o nome; o trigger impede mudar o próprio nível/situação
create policy "Perfis: o próprio usuário ou avançado altera"
  on public.perfis_usuarios for update to authenticated
  using (id = (select auth.uid()) or (select privado.tem_nivel('avancado')))
  with check (id = (select auth.uid()) or (select privado.tem_nivel('avancado')));

create policy "Perfis: avançado exclui (exceto a si mesmo e admins)"
  on public.perfis_usuarios for delete to authenticated
  using ((select privado.tem_nivel('avancado')) and id <> (select auth.uid()) and perfil is distinct from 'admin');

drop policy "Pessoas: equipe de cadastro lê" on public.pessoas;
drop policy "Pessoas: equipe de cadastro cria" on public.pessoas;
drop policy "Pessoas: equipe de cadastro altera" on public.pessoas;
drop policy "Pessoas: admin exclui" on public.pessoas;

create policy "Pessoas: nível básico lê" on public.pessoas for select to authenticated
  using ((select privado.tem_nivel('basico')));
create policy "Pessoas: nível básico cria" on public.pessoas for insert to authenticated
  with check ((select privado.tem_nivel('basico')));
create policy "Pessoas: nível básico altera" on public.pessoas for update to authenticated
  using ((select privado.tem_nivel('basico'))) with check ((select privado.tem_nivel('basico')));
create policy "Pessoas: nível avançado exclui" on public.pessoas for delete to authenticated
  using ((select privado.tem_nivel('avancado')));

drop policy "Matrículas: equipe de cadastro lê" on public.matriculas;
drop policy "Matrículas: equipe de cadastro cria" on public.matriculas;
drop policy "Matrículas: equipe de cadastro altera" on public.matriculas;
drop policy "Matrículas: admin exclui" on public.matriculas;

create policy "Matrículas: nível básico lê" on public.matriculas for select to authenticated
  using ((select privado.tem_nivel('basico')));
create policy "Matrículas: nível básico cria" on public.matriculas for insert to authenticated
  with check ((select privado.tem_nivel('basico')));
create policy "Matrículas: nível básico altera" on public.matriculas for update to authenticated
  using ((select privado.tem_nivel('basico'))) with check ((select privado.tem_nivel('basico')));
create policy "Matrículas: nível avançado exclui" on public.matriculas for delete to authenticated
  using ((select privado.tem_nivel('avancado')));

drop policy "Saúde: equipe de cadastro lê" on public.fichas_saude;
drop policy "Saúde: equipe de cadastro cria" on public.fichas_saude;
drop policy "Saúde: equipe de cadastro altera" on public.fichas_saude;
drop policy "Saúde: admin exclui" on public.fichas_saude;

create policy "Saúde: nível básico lê" on public.fichas_saude for select to authenticated
  using ((select privado.tem_nivel('basico')));
create policy "Saúde: nível básico cria" on public.fichas_saude for insert to authenticated
  with check ((select privado.tem_nivel('basico')));
create policy "Saúde: nível básico altera" on public.fichas_saude for update to authenticated
  using ((select privado.tem_nivel('basico'))) with check ((select privado.tem_nivel('basico')));
create policy "Saúde: nível avançado exclui" on public.fichas_saude for delete to authenticated
  using ((select privado.tem_nivel('avancado')));

drop policy "Conteúdo do site: admin e editor alteram" on public.conteudo_site;

create policy "Conteúdo do site: nível intermediário altera" on public.conteudo_site for update to authenticated
  using ((select privado.tem_nivel('intermediario'))) with check ((select privado.tem_nivel('intermediario')));

drop policy "Fotos: equipe de cadastro lê" on storage.objects;
drop policy "Fotos: equipe de cadastro envia" on storage.objects;
drop policy "Fotos: equipe de cadastro substitui" on storage.objects;
drop policy "Fotos: equipe de cadastro exclui" on storage.objects;

create policy "Fotos: nível básico lê" on storage.objects for select to authenticated
  using (bucket_id = 'fotos-pessoas' and (select privado.tem_nivel('basico')));
create policy "Fotos: nível básico envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-pessoas' and (select privado.tem_nivel('basico')));
create policy "Fotos: nível básico substitui" on storage.objects for update to authenticated
  using (bucket_id = 'fotos-pessoas' and (select privado.tem_nivel('basico')));
create policy "Fotos: nível básico exclui" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-pessoas' and (select privado.tem_nivel('basico')));

drop policy "Modalidades: admin cria" on public.modalidades_servicos;
drop policy "Modalidades: admin altera" on public.modalidades_servicos;
drop policy "Modalidades: admin exclui" on public.modalidades_servicos;

create policy "Modalidades: nível avançado cria" on public.modalidades_servicos for insert to authenticated
  with check ((select privado.tem_nivel('avancado')));
create policy "Modalidades: nível avançado altera" on public.modalidades_servicos for update to authenticated
  using ((select privado.tem_nivel('avancado'))) with check ((select privado.tem_nivel('avancado')));
create policy "Modalidades: nível avançado exclui" on public.modalidades_servicos for delete to authenticated
  using ((select privado.tem_nivel('avancado')));

-- Função antiga, substituída por tem_nivel
drop function privado.tem_perfil(text[]);

commit;
