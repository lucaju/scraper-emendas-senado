import type { FilterOptions, FindParams } from '../../type.ts';
import { argv } from './argv.ts';
import { prompt } from './inquirer.ts';

export interface SetupOptions extends FindParams {
	materia: string;
}

export const initSetup = async (): Promise<SetupOptions> => {
	//1. CLI arguments
	if (argv.materia) {
		const materia = argv.materia.trim();
		const mergePdf = argv.merge_pdf ?? false;
		const filter = {
			autor: argv.autor ?? undefined,
			data_apresentacao: argv.data_apresentacao ?? undefined,
			deliberacao: argv.deliberacao as FilterOptions['deliberacao'] | undefined,
		} as const;
		return { materia, mergePdf, filter };
	}

	//2. Interactive prompt
	const { materia, mergePdf, filter } = await prompt();
	return { materia, mergePdf, filter };
};
