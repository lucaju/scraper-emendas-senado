import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import pkg from '../../../package.json' with { type: 'json' };

export const argv = yargs(hideBin(process.argv))
	.usage('Senado Federal - Scrape emendas de projetos de lei\n\nUsage: $0 [options]')
	.help('help')
	.alias('help', 'h')
	.version(pkg.version)
	.alias('version', 'V')
	.options({
		materia: {
			alias: 'm',
			string: true,
			description:
				'Numero da matéria (a parte numerica no final do url do projeto de lei). \n Exemplo: https://www25.senado.leg.br/web/atividade/materias/-/materia/157233 \n > materia 157233',
		},
		skipDownloadPdf: {
			alias: 's',
			boolean: true,
			default: false,
			description: 'Não baixar os PDFs das emendas.',
		},
		mergePdf: {
			alias: 'mp',
			boolean: true,
			default: false,
			description: 'Juntar os PDFs em um único arquivo.',
		},
	})
	.parseSync();
