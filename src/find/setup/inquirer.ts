import { confirm, input, select } from '@inquirer/prompts';
import type { FilterOptions } from '../../type.ts';
import type { SetupOptions } from './index.ts';

export const prompt = async (): Promise<SetupOptions> => {
	const materia = await input({
		message: 'Numero da matéria',
		required: true,
		validate: (value: string) => value !== '',
	});

	const filter = {
		autor: await input({
			message: 'Filtrar por autor',
		}),
		data: await input({
			message: 'Filtrar por data',
		}),
		deliberacao: (await select({
			message: 'Filtrar por status da emenda',
			choices: ['acolhida', 'rejeitada', 'retirada', 'nao_filtrado', 'todos'],
			default: 'todos',
		})) as 'acolhida' | 'rejeitada' | 'retirada' | 'nao_filtrado' | 'todos',
	} as FilterOptions;

	const mergePdf = await confirm({
		message: 'Deseja juntar os PDFs em um único arquivo?',
		default: false,
	});

	return { materia, mergePdf, filter };
};
