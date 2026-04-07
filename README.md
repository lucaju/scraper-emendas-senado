# Scraper de emendas de projetos de lei do Senado Federal

Ferramenta para extrair e baixar emendas de matérias legislativas do Senado Federal Brasileiro, com exportação em JSON/CSV, download opcional de PDFs, junção opcional em um único PDF e um segundo comando para localizar subconjuntos das emendas já extraídas (filtros por autor, data e deliberação). Após o scrape bruto da página, o script enriquece cada registro com partido, UF, tendência politica (codificada pelos autores desse projeto) e campos derivados do histórico de deliberação.

**Exemplo de projeto de lei:** [https://www25.senado.leg.br/web/atividade/materias/-/materia/157233](https://www25.senado.leg.br/web/atividade/materias/-/materia/157233)

## Características

- Extração dos dados das emendas da página da matéria
- Enriquecimento pós-scrape: partido e estado a partir do texto do autor, tendência partidária a partir de CSV configurável, e a situacao da emenda apos deliberacao
- Download opcional dos PDFs
- Opção de gerar um único com todas as emendas (após o download)
- Exporta em JSON e CSV
- Interface CLI e prompts interativos (quando não há argumentos suficientes)
- Organização automática de arquivos sob `resultados/<materia>/`

## Requisitos

- **Node.js** `>= 22.12.0`
- **pnpm** (recomendado)

## Estrutura do projeto

```text
src/
├── config.ts                 # URL base e pasta de saída padrão
├── type.ts                   # Tipos Zod (Emenda, filtros, parâmetros do find)
├── utils.ts                  # JSON/CSV, listagem de PDFs, merge
├── partido-tendencia.csv     # Mapa partido → tendência
├── scraper/
│   ├── index.ts              # Entrada: `pnpm scrape`
│   ├── scraper.ts            # Leitura da tabela de emendas na página
│   ├── parsing.ts            # Enriquecimento (partido, UF, tendência, deliberação)
│   ├── download.ts           # Download dos PDFs
│   ├── http.ts               # fetch com timeout e retries
│   └── setup/                # argv, inquirer, initSetup (config)
└── find/
    ├── index.ts              # Entrada: `pnpm find`
    ├── find.ts               # Leitura de emendas.json e aplicação dos filtros
    └── setup/                # argv, inquirer, initSetup
```

## Dados extraídos

Campos vindos da página (scrape) e preenchidos ou refinados no parsing estão definidos em `src/type.ts`.

- **id** — identificação da emenda
- **autor** — texto da coluna autor (costuma incluir partido/UF entre parênteses)
- **partido** — extraído do trecho entre parênteses no autor, quando possível
- **estado** — UF extraída do mesmo trecho, quando possível
- **tendencia** — Tendencia politica de cada partido anotada pelos autores (`src/partido-tendencia.csv`)
- **dataApresentacao** — data de apresentação (`DD/MM/AAAA`)
- **turno** — quando presente na tabela
- **historicoDeliberacao** — texto bruto da coluna de situação / histórico
- **deliberacao**, **deliberacaoLocal**, **deliberacaoData** — quando o histórico contém segmentos separados por `-`, o primeiro vira situação resumida, o segundo local e o terceiro data
- **pdfLink** e **pdfFilename** — link na página e nome de arquivo previsto para o PDF após download

Para incluir ou ajustar tendências, edite `src/partido-tendencia.csv` (cabeçalho `partido,tendencia`, uma linha por partido).

## Instalação

```bash
pnpm install
```

## Uso

O projeto expõe dois scripts:

| Comando       | Descrição                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm scrape` | Baixa a página, extrai emendas, enriquece o material (partido/tendência/deliberação), grava JSON/CSV e, por padrão, os PDFs |
| `pnpm find`   | Lê `resultados/<materia>/emendas.json`, aplica filtros e grava em subpasta                                                  |

Execute os scripts a partir da **raiz do repositório**: o fluxo do scrape carrega `src/partido-tendencia.csv` com caminho relativo ao diretório de trabalho atual.

### Scraper (`pnpm scrape`)

#### Precedência da configuração

1. **`--materia` / `-m`** na linha de comando (se informado, ignora arquivo de configuração e prompt)
2. **`config.json`** no diretório raiz (deve conter `"materia"` não vazio); pode incluir opções de `skipDownloadPdf` e `mergePdf`
3. **Modo interativo**: matéria, se deseja baixar PDFs e se deseja mesclar em um único arquivo

#### Opções de linha de comando (scraper)

| Opção               | Alias | Descrição                                                          |
| ------------------- | ----- | ------------------------------------------------------------------ |
| `--materia`         | `-m`  | Número da matéria (trecho final da URL)                            |
| `--skipDownloadPdf` | `-s`  | Não baixar PDFs (só JSON/CSV)                                      |
| `--mergePdf`        | `-mp` | Após os downloads, gerar `combined_output.pdf` na pasta da matéria |

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

### Find (`pnpm find`)

Usa o arquivo **`resultados/<materia>/emendas.json`** produzido pelo scraper (e os PDFs em `resultados/<materia>/pdfs/`).

- Se **`--materia`** for passada, as opções de filtro vêm dos flags abaixo (na CLI, `--deliberacao` tem padrão `acolhida` se você não passar o flag).
- Caso contrário, o comando entra no **modo interativo** (matéria, autor, data, status da emenda com seleção múltipla, opção de mesclar PDFs).

#### Opções de linha de comando (find)

| Opção                 | Alias | Descrição                                                                                                                                                                                                       |
| --------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--materia`           | `-m`  | Número da matéria                                                                                                                                                                                               |
| `--merge_pdf`         | `-mp` | Mesclar em `combined_output.pdf` apenas os PDFs das emendas que passaram no filtro                                                                                                                              |
| `--autor`             | `-a`  | Substring do autor (case-insensitive)                                                                                                                                                                           |
| `--data_apresentacao` | `-d`  | Data exata no formato `DD/MM/AAAA`                                                                                                                                                                              |
| `--deliberacao`       | `-dl` | Filtrar por situação da emenda; pode repetir o flag para vários valores. Valores: `acolhida`, `acolhida parcialmente`, `rejeitada`, `retirada`. Padrão na CLI (quando o flag não é passado): apenas `acolhida`. |

O filtro de deliberação compara com o campo **deliberacao** já normalizado no JSON (primeiro segmento do histórico após o parsing), em minúsculas.

Exemplos:

```bash
pnpm find -- --materia 157233 --deliberacao acolhida --merge_pdf
pnpm find -- --materia 157233 -dl acolhida -dl rejeitada
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

### Após o find

É criada uma subpasta cujo nome começa com `filtro` e inclui sufixos conforme os critérios (ex.: `filtro-acolhida`):

```text
resultados/
└── 157233/
    ├── emendas.json           # resultado completo do scraper (inalterado pelo find)
    ├── pdfs/
    └── filtro-acolhida/       # exemplo
        ├── emendas.json
        ├── emendas.csv
        └── combined_output.pdf   # se --merge_pdf
```

## Estrutura dos dados (JSON)

Campos alinhados ao schema Zod em `src/type.ts`:

```json
{
 "id": "…",
 "autor": "…",
 "partido": "…",
 "estado": "…",
 "tendencia": "…",
 "dataApresentacao": "DD/MM/AAAA",
 "turno": "…",
 "historicoDeliberacao": "…",
 "deliberacao": "…",
 "deliberacaoLocal": "…",
 "deliberacaoData": "…",
 "pdfLink": "https://…",
 "pdfFilename": "….pdf"
}
```

`partido`, `estado`, `tendencia`, `turno`, `historicoDeliberacao`, `deliberacao`, `deliberacaoLocal`, `deliberacaoData`, `pdfLink` e `pdfFilename` podem estar ausentes ou vazios conforme a linha na página, o parsing ou o sucesso do download.

## Solução de problemas

### Erro de conexão

1. Verifique a rede e se o site do Senado responde.
2. Confira o número da matéria na URL.

### Nenhuma emenda no scraper

- A estrutura da página pode ter mudado; confira se o bloco de emendas ainda usa as mesmas tabelas.
- Verifique mensagens de erro no terminal.

### `pnpm find` sem resultado

- É necessário rodar o scraper antes para existir `resultados/<materia>/emendas.json`.
- Filtros muito restritivos retornam “nenhuma emenda” e o comando encerra com erro.

### PDFs

- Alguns links podem falhar temporariamente; confira o log.
- Garanta espaço em disco em `resultados/`.
- Para mesclar, é preciso haver **pelo menos dois** PDFs correspondentes à operação (lista completa no scraper ou subconjunto filtrado no find).

### Dependências

```bash
rm -rf node_modules
pnpm install
```

## Tecnologias utilizadas

- **Node.js**
- **TypeScript**
- **Cheerio** — HTML parser
- **Yargs** — CLI
- **Zod** — validação de config e dados
- **@inquirer/prompts** — prompts interativos
- **pdf-merger-js** — PDF único opcional
- **Biome** — lint e formatação

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
