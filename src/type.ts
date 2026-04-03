import { z } from 'zod';

export const emendaSchema = z.object({
	id: z.string(),
	autor: z.string(),
	data: z.string(),
	turno: z.string().optional(),
	deliberacao: z.string().optional(),
	pdfLink: z.string().optional(),
	pdfFilename: z.string().optional(),
});

export type Emenda = z.infer<typeof emendaSchema>;

export const filterDataSchemaOptions = z.object({
	autor: z.string().min(3).optional(),
	data: z
		.string()
		.regex(/^\d{2}\/\d{2}\/\d{4}$/)
		.optional(),
	deliberacao: z.enum(['acolhida', 'rejeitada', 'retirada', 'todos']).optional(),
});

export type FilterDataOptions = z.infer<typeof filterDataSchemaOptions>;

export const filterParamsSchema = z.object({
	mergePdf: z.boolean().optional(),
	filter: filterDataSchemaOptions.optional(),
});

export type FilterParams = z.infer<typeof filterParamsSchema>;
