# Scraper de emendas de projetos de lei do Senado Federal

Ferramenta para extrair e baixar emendas de matérias legislativas do Senado Federal Brasileiro, com exportação em JSON/CSV, download opcional de PDFs, junção opcional em um único PDF e um segundo comando para filtrar resultados já extraídos.

**Exemplo de projeto de lei:** [https://www25.senado.leg.br/web/atividade/materias/-/materia/157233](https://www25.senado.leg.br/web/atividade/materias/-/materia/157233)

## Características

- Extração dos dados das emendas a partir do acordeão **Emendas** da página da matéria
- Download opcional dos PDFs (sequencial), com barras de progresso
- Opção de gerar um único `combined_output.pdf` com todas as emendas (após o download)
- Requisições HTTP com tempo limite, `User-Agent` e novas tentativas em falhas transitórias (rede, 429, 502–504)
- Exportação em JSON e CSV
- Comando **`filter`**: lê `emendas.json` já gerado, aplica filtros (autor, data, status da deliberação) e grava outra pasta dentro da matéria; pode mesclar só os PDFs filtrados
- Interface CLI e prompts interativos (quando não há argumentos suficientes)
- Organização automática de arquivos sob `resultados/<materia>/`

## Requisitos

- **Node.js** `>= 22.12.0` (conforme `package.json`)
- **pnpm** (recomendado; versão indicada em `packageManager`)

## Estrutura do projeto

```text
src/
├── config.ts                 # URL base e pasta de saída padrão
├── type.ts                   # Tipos Zod (Emenda, opções de filtro)
├── utils.ts                  # JSON/CSV, listagem de PDFs, merge
├── scraper/
│   ├── index.ts              # Entrada: `pnpm scrape`
│   ├── scraper.ts            # Parsing da página (Cheerio)
│   ├── download.ts           # Download dos PDFs
│   ├── http.ts               # fetch com timeout e retries
│   └── setup/                # argv, inquirer, initSetup (config)
└── filter/
    ├── index.ts              # Entrada: `pnpm filter`
    ├── filter-data.ts        # Leitura de emendas.json e filtros
    └── setup/
```

## Dados extraídos

- **Identificação** da emenda (texto do link/célula, ex.: rótulo da emenda)
- **Autor**
- **Data** de apresentação
- **Turno** (quando presente na tabela)
- **Deliberação / histórico** (texto da coluna de situação, quando presente)
- **Link do PDF** e nome do arquivo gerado após download bem-sucedido

## Instalação

```bash
pnpm install
```

## Uso

O projeto expõe dois scripts:

| Comando        | Descrição |
|----------------|-----------|
| `pnpm scrape`  | Baixa a página, extrai emendas, grava JSON/CSV e, por padrão, os PDFs |
| `pnpm filter`  | Lê `resultados/<materia>/emendas.json`, aplica filtros e grava em subpasta |

### Scraper (`pnpm scrape`)

#### Precedência da configuração

1. **`--materia` / `-m`** na linha de comando (se informado, ignora arquivo e prompt)
2. **`config.json`** no diretório atual (deve conter `"materia"` não vazio); pode incluir também `skipDownloadPdf` e `mergePdf`
3. **Modo interativo** (`@inquirer/prompts`): matéria, se deseja baixar PDFs e se deseja mesclar em um único arquivo

#### Opções de linha de comando (scraper)

| Opção | Alias | Descrição |
|-------|-------|-----------|
| `--materia` | `-m` | Número da matéria (trecho final da URL) |
| `--skipDownloadPdf` | `-s` | Não baixar PDFs (só JSON/CSV) |
| `--mergePdf` | `-mp` | Após os downloads, gerar `combined_output.pdf` na pasta da matéria |

Exemplos:

```bash
pnpm scrape -- --materia 157233
pnpm scrape -- -m 157233 -s
pnpm scrape -- -m 157233 --mergePdf
```

#### `config.json` (scraper)

```json
{
  "materia": "157233",
  "skipDownloadPdf": false,
  "mergePdf": false
}
```

Depois:

```bash
pnpm scrape
```

### Filtro (`pnpm filter`)

Usa o arquivo **`resultados/<materia>/emendas.json`** produzido pelo scraper (e os PDFs em `resultados/<materia>/pdfs/` se você usar `--merge_pdf`).

- Se **`--materia`** for passada, as opções de filtro vêm dos flags abaixo.
- Caso contrário, o comando entra no **modo interativo** (matéria, filtros, merge).

#### Opções de linha de comando (filter)

| Opção | Alias | Descrição |
|-------|-------|-----------|
| `--materia` | `-m` | Número da matéria |
| `--merge_pdf` | `-mp` | Mesclar em `combined_output.pdf` apenas os PDFs das emendas que passaram no filtro |
| `--filtrar_por_autor` | `-fa` | Substring do autor (case insensitive) |
| `--filtrar_por_data` | — | Data exata no formato `DD/MM/AAAA` (prefira o nome longo; ver nota abaixo) |
| `--filtrar_por_deliberacao` | — | Uma de: `acolhida`, `rejeitada`, `retirada` |

**Comportamento com `--materia`:** o Yargs define **`filtrar_por_deliberacao` com padrão `acolhida`**. Ou seja, `pnpm filter -- -m 157233` aplica filtro por deliberação “acolhida” mesmo sem você repetir o flag. Para **outro status**, passe explicitamente `--filtrar_por_deliberacao rejeitada` (ou `retirada`). Para combinar filtros como no prompt interativo (incluindo “todos” / sem filtrar por status), rode **`pnpm filter` sem `--materia`**.

**Alias `-fd`:** em `argv` do filtro, data e deliberação declaram o mesmo alias curto; use **`--filtrar_por_data`** e **`--filtrar_por_deliberacao`** para evitar ambiguidade.

Exemplo:

```bash
pnpm filter -- --materia 157233 --filtrar_por_deliberacao acolhida --merge_pdf
```

## Saída

### Após o scraper

```text
resultados/
└── 157233/
    ├── emendas.json
    ├── emendas.csv
    ├── pdfs/
    │   ├── <nome_derivado_da_emenda>.pdf
    │   └── ...
    └── combined_output.pdf    # apenas se --mergePdf / mergePdf: true
```

### Após o filter

É criada uma subpasta cujo nome começa com `filtro` e inclui sufixos conforme os critérios (ex.: `filtro-acolhida`):

```text
resultados/
└── 157233/
    ├── emendas.json           # resultado completo do scraper (inalterado pelo filter)
    ├── pdfs/
    └── filtro-acolhida/       # exemplo
        ├── emendas.json
        ├── emendas.csv
        └── combined_output.pdf   # se --merge_pdf
```

## Estrutura dos dados (JSON)

Campos alinhados ao schema em `src/type.ts`:

```json
{
  "id": "…",
  "autor": "…",
  "data": "DD/MM/AAAA",
  "turno": "…",
  "deliberacao": "…",
  "pdfLink": "https://…",
  "pdfFilename": "….pdf"
}
```

`turno`, `deliberacao`, `pdfLink` e `pdfFilename` podem estar ausentes ou vazios conforme a linha na página ou o sucesso do download.

## Funcionamento técnico

- **URL da matéria:** `https://www25.senado.leg.br/web/atividade/materias/-/materia/{NUMERO}` (`DEFAULT_BASE_URL` em `config.ts`)
- **Parsing HTML** com Cheerio (`table.tabela-emendas` dentro de `#emendas`)
- **Downloads sequenciais** de PDFs; falhas em um item são registradas e o fluxo segue para os demais
- **Junção de PDFs:** `pdf-merger-js`
- **Sem autenticação** (dados públicos)

## Solução de problemas

### Erro de conexão

1. Verifique a rede e se o site do Senado responde.
2. Confira o número da matéria na URL.

### Nenhuma emenda no scraper

- A estrutura da página pode ter mudado; confira se o bloco de emendas ainda usa as mesmas tabelas.
- Verifique mensagens de erro no terminal.

### `pnpm filter` sem resultado

- É necessário rodar o scraper antes para existir `resultados/<materia>/emendas.json`.
- Filtros muito restritivos retornam “nenhuma emenda” e o comando encerra com erro.

### PDFs

- Alguns links podem falhar temporariamente; confira o log.
- Garanta espaço em disco em `resultados/`.
- Para mesclar, é preciso haver **pelo menos dois** PDFs correspondentes à operação (lista completa no scraper ou subconjunto filtrado no filter).

### Dependências

```bash
rm -rf node_modules
pnpm install
```

## Tecnologias utilizadas

- **Node.js** (ES modules, `fetch`)
- **TypeScript**
- **Cheerio** — HTML
- **Yargs** — CLI
- **Zod** — validação de config e dados
- **@inquirer/prompts** — prompts interativos
- **Ora** — spinner no scraper
- **tasktree-cli** — barras de progresso nos downloads
- **Kleur** — cores no terminal
- **pdf-merger-js** — PDF único opcional
- **Biome** — lint e formatação (`pnpm lint`, `pnpm format`)

## Licença

GNU Affero General Public License v3.0 (AGPL-3.0)

Este projeto é licenciado sob a AGPL-3.0, uma licença de software livre copyleft que garante que o código fonte permaneça livre mesmo quando utilizado em serviços de rede.

**Principais pontos da AGPL-3.0:**

- **Liberdade de uso** — Use o software para qualquer propósito
- **Liberdade de estudo** — Acesse e modifique o código fonte
- **Liberdade de distribuição** — Compartilhe cópias do software
- **Liberdade de melhorias** — Distribua versões modificadas
- **Obrigação de compartilhamento** — Se modificar e usar em um serviço de rede, deve disponibilizar o código fonte modificado

Veja o arquivo `LICENSE` para os termos completos da licença.
