// Edge Function "admin-usuarios": cria e exclui usuários do sistema.
// Precisa da chave secreta (service role), que só existe dentro do Supabase e nunca vai para o site.
//
// Publicar: Supabase → Edge Functions → Deploy a new function → Via Editor →
// nome "admin-usuarios" → colar este arquivo → Deploy.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já ficam disponíveis automaticamente.
//
// Regras (as mesmas do banco):
// - só usuários ativos de nível avançado ou admin podem usar;
// - nunca cria nem exclui admins (admin só direto no banco);
// - ninguém exclui a si mesmo.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CREATABLE_LEVELS = ['basico', 'intermediario', 'avancado'];
const MANAGER_LEVELS = ['avancado', 'admin'];
const PASSWORD_RULES = [/.{10,}/, /[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Quem está pedindo?
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await admin.auth.getUser(token);
    const caller = auth.user;
    if (!caller) {
      return json({ erro: 'Sessão inválida. Entre novamente.' }, 401);
    }
    const { data: callerProfile } = await admin
      .from('perfis_usuarios')
      .select('perfil, ativo')
      .eq('id', caller.id)
      .maybeSingle();
    if (!callerProfile?.ativo || !MANAGER_LEVELS.includes(callerProfile.perfil)) {
      return json({ erro: 'Apenas usuários de nível avançado podem gerenciar usuários.' }, 403);
    }

    const body = await req.json();

    if (body.acao === 'criar') {
      const nome = String(body.nome ?? '').trim();
      const email = String(body.email ?? '').trim().toLowerCase();
      const nivel = String(body.nivel ?? '');
      const senha = String(body.senha ?? '');

      if (!nome || nome.length > 150) {
        return json({ erro: 'Informe o nome completo.' }, 400);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ erro: 'Informe um e-mail válido.' }, 400);
      }
      if (!CREATABLE_LEVELS.includes(nivel)) {
        return json({ erro: 'Nível inválido. O nível admin só pode ser definido direto no banco de dados.' }, 400);
      }
      if (!PASSWORD_RULES.every(rule => rule.test(senha))) {
        return json({ erro: 'A senha provisória não atende às regras de senha segura.' }, 400);
      }

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { full_name: nome },
      });
      if (error || !created.user) {
        const exists = error?.code === 'email_exists' || /already/i.test(error?.message ?? '');
        return json({ erro: exists ? 'Já existe um usuário com este e-mail.' : 'Não foi possível criar o usuário.' }, 400);
      }

      // O perfil é criado pelo gatilho do banco (inativo); aqui ele recebe nome, nível e é ativado
      const { error: profileError } = await admin
        .from('perfis_usuarios')
        .update({ nome_completo: nome, perfil: nivel, ativo: true })
        .eq('id', created.user.id);
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ erro: 'Não foi possível configurar o novo usuário.' }, 500);
      }
      return json({ id: created.user.id });
    }

    if (body.acao === 'excluir') {
      const id = String(body.id ?? '');
      if (id === caller.id) {
        return json({ erro: 'Você não pode excluir a si mesmo.' }, 400);
      }
      const { data: target } = await admin.from('perfis_usuarios').select('perfil').eq('id', id).maybeSingle();
      if (!target) {
        return json({ erro: 'Usuário não encontrado.' }, 404);
      }
      if (target.perfil === 'admin') {
        return json({ erro: 'Usuários admin só podem ser excluídos direto no banco de dados.' }, 403);
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) {
        return json({ erro: 'Não foi possível excluir o usuário.' }, 500);
      }
      return json({ ok: true });
    }

    return json({ erro: 'Ação inválida.' }, 400);
  } catch {
    return json({ erro: 'Erro inesperado. Tente novamente.' }, 500);
  }
});
