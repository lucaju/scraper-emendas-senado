import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import pkg from '../../../package.json' with { type: 'json' };

export const argv = yargs(hideBin(process.argv))
	.usage('Merge PDFs\n\nUsage: $0 [options]')
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
		merge_pdf: {
			alias: 'mp',
			boolean: true,
			default: false,
			description: 'Juntar os PDFs em um único arquivo.',
		},
		filtrar_por_autor: {
			alias: 'fa',
			string: true,
			description: 'Filtrar por autor.',
		},
		filtrar_por_data: {
			alias: 'fd',
			string: true,
			regex: /^\d{2}\/\d{2}\/\d{4}$/,
			description: 'Filtrar por data.',
		},
		filtrar_por_deliberacao: {
			alias: 'fd',
			choices: ['acolhida', 'rejeitada', 'retirada'],
			default: 'acolhida',
			description: 'Filtrar por status da emenda (acolhida, rejeitada ou retirada).',
		},
	})
	.parseSync();
