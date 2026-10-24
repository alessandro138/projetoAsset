# projetoAsset

Sistema de apoio à administração da **ASSET – Associação Educar Para Transformar**, organização da sociedade civil que atua com educação infantil na cidade de São Paulo.

## Funcionalidades

- **Página principal** (`/principal`): apresentação da associação, destaques, últimas notícias, sobre nós (missão, visão e valores), contato e carrossel de parceiros. O conteúdo vem de dados editáveis, para que o administrador possa atualizá-lo sem mexer em código.
- **Cadastro de pessoas** (`/cadastro/pessoas`): condutores, beneficiários e tutores legais, com:
  - validação de CPF (dígitos verificadores, sequências repetidas e duplicidade);
  - beneficiário menor de idade vinculado obrigatoriamente a um tutor legal maior de idade;
  - máscaras de CPF, CEP e telefone;
  - CPF parcialmente oculto nas listagens e registro de consentimento (LGPD).
- **Gestão de usuários** (`/cadastro/usuarios`) e **ativos e patrimônio** (`/ativosPatrimonio`): em construção.

> Ainda não há backend: os dados ficam em memória e se perdem ao recarregar a página.

## Tecnologias

- [Angular](https://angular.dev/) 19 (componentes standalone e signals), TypeScript e RxJS
- [Bootstrap](https://getbootstrap.com/) 5.3 (SCSS), Bootstrap Icons e fonte Plus Jakarta Sans
- Testes unitários com Karma e Jasmine

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou 22 (LTS)
- [Yarn](https://classic.yarnpkg.com/) 1.x

O projeto usa o registry público do npm, definido em `.yarnrc`.

## Como executar

```bash
yarn install   # instala as dependências
yarn start     # servidor de desenvolvimento em http://localhost:4200
```

A página recarrega sozinha a cada alteração no código.

## Outros comandos

| Comando | Descrição |
| --- | --- |
| `yarn build` | Gera a versão de produção em `dist/projeto-asset` |
| `yarn test` | Executa os testes unitários (use `--watch=false --browsers=ChromeHeadless` para rodar uma vez, sem abrir o navegador) |
| `yarn watch` | Gera a versão de desenvolvimento a cada alteração |

## Estrutura

```
src/
├── app/
│   ├── models/          # Modelos de dados (pessoa, conteúdo do site)
│   ├── pages/           # Telas: principal, cadastro, ativos e patrimônio
│   ├── services/        # Serviços e conteúdo inicial da página principal
│   └── shared/          # Componentes, diretivas, validators e utilitários reutilizáveis
├── styles/              # Variáveis do tema (cores da ASSET)
└── styles.scss          # Estilos globais e utilitários do template
public/                  # Logo e imagens (notícias e parceiros)
```

## Identidade visual

- Cores tiradas do logo: azul `#006DBF` (primária) e rosa `#CC0665` (secundária), definidas em `src/styles/_variables.scss`.
- Layout baseado no template [Start Bootstrap - Personal](https://github.com/StartBootstrap/startbootstrap-personal), licença MIT, Copyright (c) 2013-2023 Start Bootstrap LLC.
- Textos e imagens iniciais da página principal extraídos do site atual da associação: [educaretransformar.org.br](https://educaretransformar.org.br/).
