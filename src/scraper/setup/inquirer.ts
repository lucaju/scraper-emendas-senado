import { confirm, input } from '@inquirer/prompts';
import { z } from 'zod';

const inquirerResultSchema = z.object({
	materia: z.string().min(1),
	downloadPdf: z.boolean().default(true),
	mergePdf: z.boolean().default(false),
});

export type InquirerResult = z.infer<typeof inquirerResultSchema>;

export const prompt = async (): Promise<InquirerResult> => {
	const materia = await input({
		message: 'Numero da matéria',
		required: true,
		validate: (value: string) => value !== '',
	});

	const downloadPdf = await confirm({
		message: 'Deseja baixar os PDFs das emendas?',
		default: true,
	});

	const mergePdf = await confirm({
		message: 'Deseja juntar os PDFs em um único arquivo?',
		default: false,
	});

	return { materia, downloadPdf, mergePdf };
};
