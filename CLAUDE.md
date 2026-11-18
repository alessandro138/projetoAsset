# projetoAsset

Sistema para auxiliar a administração da **Associação Educar para Transformar (ASSET)**. O nome do projeto vem da sigla da associação.

## Perfis de usuário
- **Administrador**: publica e gerencia conteúdo e dados da associação
- **Visitante/público**: consulta as informações publicadas

## Módulos
- **Página institucional / publicações**: página em que o administrador publica informações sobre a associação e os projetos dela, e sobre as atividades em andamento e as já realizadas
- **Gestão de usuários**: cadastro e controle dos usuários autorizados a editar a página principal (login, permissões, ativar/desativar)
- **Cadastro de pessoas**: registro das pessoas ligadas aos projetos/atividades da ASSET, **sem acesso ao sistema** (diferente da Gestão de usuários)
  - Tipos: **condutores** (quem conduz os projetos) e **beneficiários** (quem é atendido pelos projetos/atividades)
  - Uma pessoa pode estar vinculada a um ou mais projetos/atividades
  - **Campos** (lista inicial; mais campos serão adicionados depois, então manter o modelo e o formulário fáceis de estender):
    - Nome completo (obrigatório)
    - CPF e RG (ao menos um dos dois é obrigatório)
    - Data de nascimento (obrigatório)
    - Telefone (com máscara; obrigatoriedade a definir)
    - Endereço: CEP, logradouro, número, complemento, bairro, cidade, UF (obrigatoriedade a definir)
    - Tipo: condutor e/ou beneficiário
    - Tutor legal (obrigatório quando beneficiário menor)
  - **Menores de idade**: beneficiário menor (calculado pela data de nascimento, campo obrigatório) deve ser vinculado a um **tutor legal**, que também é uma pessoa cadastrada (com CPF ou RG) e precisa ser maior de idade. Não é possível salvar um menor sem tutor
  - **Documento**: CPF ou RG, ao menos um (desde 2026-11-17; antes o CPF era obrigatório). **CPF, quando preenchido, é validado** (dígitos verificadores, rejeitar sequências repetidas como 111.111.111-11, máscara 000.000.000-00, unicidade no cadastro); implementar como validator reutilizável do Angular Reactive Forms
- **Gestão de ativos e patrimônio**: cadastro e controle de equipamentos/patrimônio da associação (módulo secundário)

## LGPD
O sistema armazena dados pessoais (CPF etc.), possivelmente de menores de idade entre os beneficiários. Por isso:
- Dados de pessoas nunca ficam públicos; apenas usuários autenticados com permissão podem acessá-los
- Coletar só os dados necessários; prever consentimento (dado pelo tutor legal, no caso de menores)
- Exibir CPF mascarado nas listagens (ex.: ***.456.789-**)

## Rotas e identidade visual
- Página principal em **`/principal`**; a raiz **`/`** redireciona para `/principal` (`{ path: '', redirectTo: 'principal', pathMatch: 'full' }`)
- Gestão de usuários e cadastro de pessoas (condutores, beneficiários e tutores) em **`/cadastro`**. Acesso restrito a usuários autenticados com permissão (LGPD). Subrotas sugeridas, a confirmar: `/cadastro/usuarios` e `/cadastro/pessoas`
- Gestão de ativos e patrimônio em **`/ativosPatrimonio`** (acesso restrito a usuários autenticados, a confirmar)
- **Identidade visual**: logo e cores **rosa e azul** da ASSET
  - Logo original em `LOGO-Asset.png` (raiz, fundo transparente); versão recortada, sem margens, em `public/logo-asset.png` (usada no cabeçalho, na página principal e como favicon)
  - Cores tiradas do logo: rosa `#CC0665` e azul `#006DBF` (ambas com contraste AA com texto branco). Definidas como variáveis CSS em `src/styles.scss` (`--color-blue`, `--color-pink`, `--color-primary` = azul, `--color-accent` = rosa, variantes `-dark`/`-light`). Nos componentes, usar sempre as variáveis, nunca cores fixas
- **Template**: [Start Bootstrap - Personal](https://github.com/StartBootstrap/startbootstrap-personal) (MIT), adaptado para Angular, sem o JS do Bootstrap (o menu recolhível e o dropdown usam signals no `AppComponent`)
  - Bootstrap 5.3 via SCSS: variáveis em `src/styles/_variables.scss` (primária = azul, secundária = rosa, fonte Plus Jakarta Sans via `@fontsource`, sem CDN externo), utilitários do template (`.bg-gradient-primary-to-secondary`, `.text-gradient`, `.profile`) em `src/styles.scss`. Bootstrap Icons (`bi bi-*`)
  - Telas usam as classes do Bootstrap (cards `rounded-4 shadow-sm`, `form-control`, `btn-primary`/`btn-secondary`, títulos com `.text-gradient`)
  - Página principal: destaque, "Destaques" (`#destaques`), "Últimas notícias" (`#noticias`), "Sobre nós" com Missão/Visão/Valores (`#sobre`), contato (`#contato`) e carrossel de parceiros (`#parceiros`, componente `app-partner-carousel`, sem JS do Bootstrap); navbar com "Área restrita" (cadastro, usuários, ativos); rodapé
  - Conteúdo inicial **extraído do site atual** https://educaretransformar.org.br/ (WordPress/Elementor; bloqueia requisições simples com 406, usar Chrome headless `--dump-dom`). Imagens em `public/images/noticias` e `public/images/parceiros` (13 logos). Os links "Ler publicação" ainda apontam para as matérias no site antigo. A página Contato do site antigo lista 11 unidades (CEIs) com foto, endereço e telefone, ainda não trazidas
  - **Conteúdo** da página principal e do rodapé vem de `SiteContentService` (modelo em `models/site-content.model.ts`, conteúdo inicial provisório em `services/default-site-content.ts`), pronto para as futuras telas de edição. Links aceitam âncora, rota interna ou URL externa (`app-smart-link`)
  - Aviso de build "4 rules skipped due to selector errors" vem do CSS do próprio Bootstrap 5.3 e é inofensivo

## Requisito central: edição sem programação
Quem edita o conteúdo é um usuário **leigo em TI**. Por isso:
- Todo o conteúdo da página principal (textos, imagens, atividades, publicações) vem de dados editáveis por telas administrativas, **nunca fixo no código**
- Alterar conteúdo nunca deve exigir mexer em código, fazer build ou deploy
- Telas administrativas simples: formulários claros, editor de texto visual (WYSIWYG), upload de imagens, pré-visualização e mensagens em português

## Stack
- Angular 19.2 (standalone components, sem NgModules), TypeScript 5.7, RxJS 7.8
- Estilos em SCSS; roteamento em `src/app/app.routes.ts`; providers em `src/app/app.config.ts`
- Testes: Karma + Jasmine
- Gerenciador de pacotes: **yarn** 1.22, usando o **npm público** (`registry.npmjs.org`, definido em `.yarnrc`), não o registry interno do BB, porque o projeto é pessoal
  - O `~/.npmrc` global (do BB) fixa `ca[]` só com as CAs do BB, o que quebra o TLS com o npmjs. Para contornar, há um `.npmrc` local (no `.gitignore`) com `cafile=C:/Users/F0427845/certs/node-public-roots.pem`, um bundle gerado a partir de `tls.rootCertificates` do Node

## Comandos
- `yarn install`: instala dependências
- `yarn start` (`ng serve`): servidor de desenvolvimento em http://localhost:4200
- `yarn build`: build de produção em `dist/projeto-asset`
- `yarn test`: testes unitários

## Convenções
- Componentes standalone, prefixo de seletor `app-`
- Gerar artefatos com o CLI (`ng generate component|service ...`)
- Código e nomes em inglês; textos da interface em português

## Ambiente
- Node 24.21 instalado em `C:\Program Files\nodejs` não é oficialmente suportado pelo Angular 19, mas `yarn install` e `yarn build` funcionaram (usar Node 20/22 LTS se houver problemas)
- Um pacote npm global chamado `node` (`%APPDATA%\npm\node*`) fica à frente do Node real no PATH e quebra o comando `node`. Nos terminais, pôr `C:\Program Files\nodejs` no início do PATH

## Status / histórico
- 2026-10-24: projeto gerado com `ng new` (routing, SCSS, sem SSR)
- 2026-10-24: dependências instaladas pelo npm público e `yarn build` OK. `git init` (branch `main`) com `user.email=alessandro0138@gmail.com` local ao repositório. Nunca usar o e-mail corporativo neste repositório
- 2026-10-24: `gh` autenticado com a conta pessoal **alessandro138** (HTTPS, `gh auth setup-git`)
- 2026-10-24: repositório **privado** criado em https://github.com/alessandro138/projetoAsset (remote `origin`, branch `main`) e commit inicial enviado
- 2026-10-24: rotas lazy (`/principal`, `/cadastro/pessoas`, `/cadastro/usuarios`, `/ativosPatrimonio`), com páginas provisórias e layout neutro. Validators em `src/app/shared/validators` (CPF, unicidade de CPF assíncrona, tutor de menor, data passada, ao menos um checkbox), utilitários em `shared/utils` e diretiva `appMask` (cpf/cep/phone). Cadastro de pessoas (listagem com CPF mascarado + formulário) usando `PersonService` **em memória** (sem persistência). Tipos de pessoa: condutor, beneficiário e tutor legal (ao menos um). Consentimento LGPD obrigatório no formulário
- 2026-11-11: cadastro do beneficiário segue a **ficha de matrícula em papel da ASSET** (3 páginas: matrícula, saúde, autorizações). Campos novos em `Person`: naturalidade, cidade/UF de nascimento, Cartão do SUS (máscara `sus`), foto 3x4 (data URL, máx. 2 MB), grau de parentesco do responsável, `enrollment` (início, término, modalidade), `health` (UBS, convênio, vacinação, vive com, parto e 15 perguntas Sim/Não com detalhes, em `HEALTH_QUESTIONS`) e `imageConsent`. Matrícula, saúde e autorização de imagem só existem para beneficiários (`beneficiaryValidator`: início, modalidade e resposta da autorização de imagem obrigatórios). Os dados do responsável (CPF, endereço, telefone) vêm do cadastro do tutor
  - **Impressão da ficha**: componente `app-enrollment-sheet` (A4, mesmo layout do papel; dados da associação e textos das autorizações em `models/organization.ts`). Botão "Imprimir ficha de matrícula" no formulário (imprime o que está digitado, mesmo sem salvar, via `window.print()` e `d-print-none`/`d-print-block`) e página `/cadastro/pessoas/:id/ficha` (botão "Ficha" na listagem)
  - Ficha de saúde é dado sensível (LGPD art. 11): exigirá acesso mais restrito quando houver autenticação
- 2026-11-11: banco escolhido: **Supabase** (PostgreSQL), região São Paulo. Esquema em `supabase/migrations/20261111120000_initial_schema.sql` (rodar no SQL Editor de um projeto novo). **Nomes no banco em português** (pedido do usuário), `snake_case` e sem acentos; o código Angular continua em inglês, então mapear na integração (ex.: `fullName` ↔ `nome_completo`; strings vazias do formulário viram `null`). Tabelas em `public` (`perfis_usuarios`, `pessoas`, `matriculas`, `fichas_saude`, `conteudo_site`) com Row Level Security em todas; funções internas em `privado` (não exposto na API). Perfis iniciais `admin`/`secretaria`/`editor`, substituídos pelos níveis de 2026-11-12; novos usuários entram inativos. Bucket privado `fotos-pessoas` para as fotos 3x4. As chaves do JSON `fichas_saude.respostas` seguem as de `HEALTH_QUESTIONS` (inglês). A migração foi validada com PGlite simulando auth/storage do Supabase (regras de CPF, menor com responsável, permissões por perfil). Nunca colocar a chave `service_role` no frontend
- 2026-11-11: **Angular integrado ao Supabase** (`@supabase/supabase-js`, projeto `veyntwtvbgqcttrppfps`, URL e chave publishable em `src/environments/environment.ts`). `SupabaseService` (cliente com `processLock`, porque `navigator.locks` conflita com o zone.js), `AuthService` (login por e-mail/senha, perfil de `perfis_usuarios`), `roleGuard` nas rotas (`/cadastro/pessoas` e `/ativosPatrimonio`: admin/secretaria; `/cadastro/usuarios`: admin), página `/login`. `PersonService` lê/grava `pessoas`, `matriculas` (usa a mais recente), `fichas_saude` e a foto no bucket `fotos-pessoas` (links assinados de 1 h); mapeamento em `services/person.mapper.ts`. O salvamento são várias chamadas (não é atômico). `SiteContentService` lê `conteudo_site` (vazio = conteúdo padrão). Nos testes, usar `testing/in-memory-person.service.ts` e substitutos para Auth/SiteContent (nada de Supabase nos testes). Usuários são criados no painel do Supabase (Authentication → Add user) e liberados com `update perfis_usuarios set perfil, ativo`
- 2026-11-11: página pública **`/unidades`** (link "Unidades" no menu e no rodapé) com as 11 unidades da página Contato do site antigo, em cards compactos (4/3/2 por linha; no celular, card horizontal), busca por nome ou bairro (sem acento/maiúscula), link "Ver no mapa" (busca no Google Maps por endereço + CEP) e o contato do escritório. Dados em `SiteContent.units` (editável); fotos em `public/images/unidades`. Endereços levemente padronizados em relação ao site antigo (ex.: "R. Leais Paulistanos"); a unidade Plenitude não tem CEP (o link de mapa do site antigo apontava para o endereço da sede)
- 2026-11-11: campo **"Modalidade"** da matrícula virou seleção (nos textos do sistema é sempre "Modalidade"; só a tabela do banco se chama `modalidades_servicos`, a pedido do usuário) carregada da tabela `modalidades_servicos` (migração `supabase/migrations/20261111150000_modalidades_servicos.sql`: `id`, `nome` único, `ativo`, `ordem`; 7 itens iniciais: Jiu-jítsu, Kickboxing, Zumba, Mulher em foco, Rede cozinha escola, Informática, Ballet). `matriculas.modalidade` (texto) foi trocada por `matriculas.modalidade_servico_id` (FK); textos antigos viram modalidades inativas. Leitura pública, só admin altera. `ModalityService` no Angular (`testing/in-memory-modality.service.ts` nos testes); o formulário mostra só as ativas, mais a já escolhida se tiver sido desativada. A ficha impressa continua com o rótulo "Modalidade:" do papel
- 2026-11-11: **troca de senha obrigatória no primeiro acesso**. Marcação `senha_alterada: true` em `user_metadata` do Supabase Auth (gravada junto com a nova senha via `auth.updateUser`); sem ela, `roleGuard` e o login levam para `/trocar-senha` (rota com `loggedInGuard`). A tela exige senha forte (`PASSWORD_RULES` em `shared/utils/password.ts`: 10+ caracteres, minúscula, maiúscula, número e símbolo) e tem "Sugerir senha segura" (`generateSecurePassword`, `crypto.getRandomValues`, sem caracteres confundíveis). "Trocar senha" também fica no menu da área restrita. Após trocar, a sessão é encerrada e o login (`/login?senhaAlterada=1`) mostra "Senha alterada com sucesso" em verde, pedindo para entrar com a nova senha
- 2026-11-12: **níveis de acesso** (migração `20261112100000_niveis_acesso.sql`): `basico` (cadastro de beneficiários), `intermediario` (+ conteúdo do site), `avancado` (+ adicionar/alterar/excluir usuários), `admin` (tudo). Cada nível inclui os anteriores (`privado.valor_nivel`/`privado.tem_nivel`; a antiga `tem_perfil` foi removida; secretaria→basico, editor→intermediario). **Admin só é definido direto no banco** (SQL Editor): o gatilho `privado.proteger_perfis` impede, pelo sistema, promover a admin, alterar/desativar admins, mudar o próprio nível/situação e alterar e-mail. `perfis_usuarios.email` preenchido pelo gatilho de criação. Usuário altera o próprio nome. No Angular: `models/user.model.ts`, `AuthService.hasLevel`, `levelGuard` (`guards/level.guard.ts`), `UserAdminService`, página `/cadastro/usuarios` ("Minha conta" para todos; "Novo usuário" e "Usuários do sistema" para avançado/admin). Criar e excluir usuários usa a **Edge Function `admin-usuarios`** (`supabase/functions/admin-usuarios/index.ts`, chave secreta só no Supabase; recusa nível admin, excluir admin e excluir a si mesmo); publicar pelo painel (Edge Functions → Deploy → Via Editor). Novo usuário recebe senha provisória e troca no primeiro acesso
- 2026-11-11: **termos de compromisso** de Jiu-jítsu e Kickboxing (textos iguais aos PDFs em papel, em `models/commitment-terms.ts`; `commitmentTermFor` reconhece a modalidade ignorando acento, hífen e espaço). Componente `app-commitment-term` (A4, reaproveita o SCSS da ficha): o nome do aluno substitui o "Eu, ____" e a data de hoje por extenso substitui "São Paulo, __ de __ de 202_". Na página da ficha (`/cadastro/pessoas/:id/ficha`), botão "Imprimir termo" quando a modalidade tem termo; cada botão imprime só o seu documento (`printTarget` + `d-print-none`). Rodapé do termo em `ORGANIZATION.termFooter` (endereço da Rua Emilio Castro, 423, confirmado pelo usuário como o correto para os termos). O formulário de cadastro também tem "Imprimir termo" (imprime o que está digitado; sem nome, mantém o sublinhado)
- 2026-11-17: **RG no cadastro de pessoas** e CPF opcional; ao menos um dos dois é obrigatório (`documentRequiredValidator` no formulário e `pessoas_tem_documento` no banco). RG ao lado do CPF, até 12 caracteres, só dígitos (o último pode ser X), gravado sem pontos e traço (`shared/utils/rg.ts`, máscara `appMask="rg"`, `rgValidator`). Sem unicidade de RG (o número se repete entre estados). Na ficha impressa (aluno e responsável) e na listagem aparece um só documento, com preferência para o CPF (`mainDocument`/`maskedMainDocument` em `shared/utils/document.ts`; RG mascarado na listagem por LGPD). Migração `supabase/migrations/20261117100000_rg.sql`
- 2026-11-18: **controle do cadastro de pessoas** (migração `supabase/migrations/20261118100000_controle_cadastro_pessoas.sql`). Coluna "Cadastrado em" na listagem (`Person.createdAt`, `formatTimestampDate`). Botão **"Desativar"** na listagem com janela de confirmação (modal com signals, sem JS do Bootstrap; avisa se a pessoa é tutor de beneficiários ativos): grava `pessoas.desativado_em`/`desativado_por`/`desativado_por_email` (`PersonService.deactivate`). Desativados ficam ocultos na listagem (chave "Mostrar cadastros desativados") e não aparecem como opção de tutor; editar continua possível; reativar só pelo banco (`desativado_em = null`). **Quem cadastrou** só no banco: `criado_por` + `criado_por_email` (cópia do e-mail, para não perder o controle se o usuário for excluído). O gatilho `privado.controlar_cadastro_pessoas` grava sempre `auth.uid()`, o e-mail do token e `now()`, ignorando valores enviados pelo sistema. Validado com PGlite
- Pendentes: autenticação e guard em `/cadastro` e `/ativosPatrimonio`; vínculo pessoa ↔ projetos/atividades (aguarda o módulo de projetos); gestão de usuários; módulo de ativos; template visual
- Testes: `yarn test --watch=false --browsers=ChromeHeadless` (Chrome em `C:\Program Files\Google\Chrome\Application`)

## Decisões e contexto
<!-- Registre aqui decisões importantes, requisitos e próximos passos, para retomar em novas sessões. -->
