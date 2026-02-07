# Scraper de emendas de projetos de lei do Senado Federal

Ferramenta completa para extrair e baixar emendas de matérias legislativas do Senado Federal Brasileiro, com suporte a download automático de PDFs e múltiplas formas de configuração.

**Exemplo de projeto de lei:** [https://www25.senado.leg.br/web/atividade/materias/-/materia/157233](https://www25.senado.leg.br/web/atividade/materias/-/materia/157233)

## Características

- ✅ Extração completa de dados das emendas
- ✅ Download automático de todos os PDFs com barra de progresso
- ✅ Exportação em JSON e CSV
- ✅ Interface CLI com múltiplas opções de uso
- ✅ Organização automática de arquivos por matéria
- ✅ Tratamento robusto de erros
- ✅ Progress indicators e feedback visual

## Estrutura do Projeto

```text
src/
├── index.ts              # Ponto de entrada principal
├── scraper.ts            # Lógica de scraping e download
├── argv.ts               # Parser de argumentos CLI
├── inquerer.ts           # Interface interativa
└── download.ts           # Download com progresso
```

## Dados Extraídos

- **Identificação** da emenda (ex: "EMENDA 1 - PL 2338/2023")
- **Autor** da emenda
- **Data** de apresentação
- **Descrição/Ementa** do conteúdo
- **Ação Legislativa** (quando disponível)
- **Link para o PDF** do documento
- **Download automático** do PDF

## Instalação

```bash
# Com npm
npm install

# Com pnpm (recomendado)
pnpm install
```

## Uso

### Opção 1: Argumentos de linha de comando

```bash
# Especificando o número da matéria diretamente
npm start -- --materia 157233

# Ou usando pnpm
pnpm start -- --materia 157233
```

### Opção 2: Arquivo de configuração

Edite o arquivo `config.json`:

```json
{
  "materia": "157233"
}
```

Depois execute:

```bash
npm start
```

### Opção 3: Modo interativo

Execute sem argumentos e sem arquivo de configuração:

```bash
npm start
```

O sistema irá perguntar o número da matéria interativamente.

## Saída

O sistema cria uma estrutura organizada de arquivos:

```text
resultados/
└── 157233/                    # Pasta com o número da matéria
    ├── emendas.json          # Dados completos em JSON
    ├── emendas.csv           # Dados em formato CSV
    └── pdfs/                 # Pasta com todos os PDFs baixados
        ├── emenda_1_pl_2338_2023.pdf
        ├── emenda_2_pl_2338_2023.pdf
        └── ...
```

### Arquivos gerados

- **`emendas.json`** - Dados completos em formato JSON
- **`emendas.csv`** - Dados tabulares em formato CSV  
- **`pdfs/`** - Todos os PDFs das emendas baixados automaticamente

## Estrutura dos Dados

Cada emenda contém os seguintes campos:

```json
{
  "id": "EMENDA 1 - PL 2338/2023",
  "autor": "Senador Astronauta Marcos Pontes (PL/SP)",
  "data": "28/11/2023",
  "descricao": "Substitutivo ao PL 2.338/2023",
  "acaoLegislativa": "Ação legislativa relacionada",
  "pdfLink": "https://legis.senado.leg.br/sdleg-getter/documento?dm=9514745&...",
  "pdfFilename": "emenda_1_pl_2338_2023.pdf"
}
```

## Funcionamento Técnico

- **Requisição única** ao site do Senado Federal
- **Parsing HTML** com Cheerio para extração estruturada
- **Download paralelo** de PDFs com barras de progresso
- **Sem autenticação** necessária (dados públicos)
- **Tratamento robusto** de erros e exceções
- **Organização automática** dos arquivos por matéria

## Personalização

### Usar com outras matérias

Basta alterar o número da matéria:

```bash
# Via argumento
npm start -- --materia 123456
```

```bash
# Via config.json
'{"materia": "123456"}' > config.json
npm start
```

### URL base

O sistema constrói automaticamente a URL:

```text
https://www25.senado.leg.br/web/atividade/materias/-/materia/{NUMERO_MATERIA}
```

## Solução de Problemas

### Erro de conexão

Se você receber erros de conexão, tente:

1. Verificar sua conexão com a internet
2. Verificar se o site do Senado está acessível
3. Confirmar se o número da matéria está correto

### Nenhuma emenda encontrada

- Verifique se a estrutura da página não mudou
- Confirme que a URL está correta e a matéria existe
- Verifique os logs de erro para mais detalhes

### Problemas com download de PDFs

- Alguns PDFs podem não estar disponíveis temporariamente
- Verifique o espaço em disco na pasta `resultados/`
- Erros de download são registrados mas não interrompem o processo

### Dependências

Certifique-se de instalar todas as dependências:

```bash
# Limpar e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Cheerio** - Parsing HTML
- **Yargs** - Parser de argumentos CLI
- **Inquirer** - Interface interativa
- **Ora** - Spinners e feedback visual
- **TaskTree** - Barras de progresso
- **Kleur** - Cores no terminal
- **Biome** - Linting e formatação

## Licença

GNU Affero General Public License v3.0 (AGPL-3.0)

Este projeto é licenciado sob a AGPL-3.0, uma licença de software livre copyleft que garante que o código fonte permaneça livre mesmo quando utilizado em serviços de rede.

**Principais pontos da AGPL-3.0:**

- ✅ **Liberdade de uso** - Use o software para qualquer propósito
- ✅ **Liberdade de estudo** - Acesse e modifique o código fonte
- ✅ **Liberdade de distribuição** - Compartilhe cópias do software
- ✅ **Liberdade de melhorias** - Distribua versões modificadas
- ⚠️ **Obrigação de compartilhamento** - Se modificar e usar em um serviço de rede, deve disponibilizar o código fonte modificado

Veja o arquivo `LICENSE` para os termos completos da licença.
