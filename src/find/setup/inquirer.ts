import { checkbox, confirm, input } from '@inquirer/prompts';
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
		data_apresentacao: await input({
			message: 'Filtrar por data',
		}),
		deliberacao: await checkbox({
			message: 'Filtrar por status da emenda',
			choices: [
				{ name: 'acolhida', value: 'acolhida' },
				{ name: 'acolhida parcialmente', value: 'acolhida parcialmente' },
				{ name: 'rejeitada', value: 'rejeitada' },
				{ name: 'retirada', value: 'retirada' },
			],
		}),
	} satisfies FilterOptions;

	const mergePdf = await confirm({
		message: 'Deseja juntar os PDFs em um único arquivo?',
		default: false,
	});

	return { materia, mergePdf, filter };
};
