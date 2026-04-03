import type { FilterParams } from '../../type.ts';
import { argv } from './argv.ts';
import { prompt } from './inquirer.ts';

export interface SetupOptions extends FilterParams {
	materia: string;
}

export const initSetup = async (): Promise<SetupOptions> => {
	//1. CLI arguments
	if (argv.materia) {
		const materia = argv.materia.trim();
		const mergePdf = argv.merge_pdf ?? false;
		const filter = {
			autor: argv.filtrar_por_autor ?? undefined,
			data: argv.filtrar_por_data ?? undefined,
			deliberacao: argv.filtrar_por_deliberacao as 'acolhida' | 'rejeitada' | 'retirada' | undefined,
		} as const;
		return { materia, mergePdf, filter };
	}

	//2. Interactive prompt
	const { materia, mergePdf, filter } = await prompt();
	return { materia, mergePdf, filter };
};
