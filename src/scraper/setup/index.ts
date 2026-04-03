import fs from 'node:fs';
import { z } from 'zod';
import { argv } from './argv.ts';
import { prompt } from './inquirer.ts';

const DEFAULT_CONFIG_FILE = './config.json';

const configSchema = z.object({
	materia: z.string().min(1),
	skipDownloadPdf: z.boolean().optional(),
	mergePdf: z.boolean().optional(),
});

export type Config = z.infer<typeof configSchema>;

export const initSetup = async (): Promise<Config> => {
	//1. CLI arguments
	if (argv.materia) {
		const materia = argv.materia.trim();
		const skipDownloadPdf = argv.skipDownloadPdf ?? false;
		const mergePdf = argv.mergePdf ?? false;
		return {
			materia,
			skipDownloadPdf,
			mergePdf,
		};
	}

	//2. Config file
	try {
		const raw = await fs.promises.readFile(DEFAULT_CONFIG_FILE, 'utf8');
		const config = configSchema.parse(JSON.parse(raw));

		return {
			materia: config.materia.trim(),
			skipDownloadPdf: config.skipDownloadPdf ?? false,
			mergePdf: config.mergePdf ?? false,
		};
	} catch {
		// Missing or unreadable config, use interactive prompt
	}

	//3. Interactive prompt
	const { materia, downloadPdf, mergePdf } = await prompt();
	return {
		materia: materia.trim(),
		skipDownloadPdf: !downloadPdf,
		mergePdf: mergePdf,
	};
};
