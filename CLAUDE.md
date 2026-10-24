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
    - CPF (obrigatório)
    - Data de nascimento (obrigatório)
    - Telefone (com máscara; obrigatoriedade a definir)
    - Endereço: CEP, logradouro, número, complemento, bairro, cidade, UF (obrigatoriedade a definir)
    - Tipo: condutor e/ou beneficiário
    - Tutor legal (obrigatório quando beneficiário menor)
  - **Menores de idade**: beneficiário menor (calculado pela data de nascimento, campo obrigatório) deve ser vinculado a um **tutor legal**, que também é uma pessoa cadastrada (com CPF) e precisa ser maior de idade. Não é possível salvar um menor sem tutor
  - **CPF obrigatório e validado para todos**, inclusive menores (dígitos verificadores, rejeitar sequências repetidas como 111.111.111-11, máscara 000.000.000-00, unicidade no cadastro); implementar como validator reutilizável do Angular Reactive Forms
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
- Layout e identidade visual da página principal virão de um **template a ser escolhido pelo usuário**. Até lá, não definir tema, cores ou layout definitivos

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
- Pendente: commit inicial; criar o repositório remoto e fazer push

## Decisões e contexto
<!-- Registre aqui decisões importantes, requisitos e próximos passos, para retomar em novas sessões. -->
