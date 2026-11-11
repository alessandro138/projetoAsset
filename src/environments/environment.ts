// Configuração do Supabase. A chave "publishable" é pública por definição (vai para o navegador):
// a proteção dos dados é feita pelas políticas de Row Level Security do banco.
// NUNCA coloque aqui a chave secret/service_role nem a senha do banco.
export const environment = {
  supabaseUrl: 'https://veyntwtvbgqcttrppfps.supabase.co',
  supabasePublishableKey: 'sb_publishable_uJBRJ0jkp8vTWNskTnRHfA_WtaFv83z',
};
