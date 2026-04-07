import { z } from 'zod';

export const emendaSchema = z.object({
	id: z.string(),
	autor: z.string(),
	partido: z.string().optional(),
	estado: z.string().optional(),
	tendencia: z.string().optional(),
	dataApresentacao: z.string(),
	turno: z.string().optional(),
	historicoDeliberacao: z.string().optional(),
	deliberacao: z.string().optional(),
	deliberacaoLocal: z.string().optional(),
	deliberacaoData: z.string().optional(),
	pdfLink: z.string().optional(),
	pdfFilename: z.string().optional(),
});

export type Emenda = z.infer<typeof emendaSchema>;

export const filterOptionsSchema = z.object({
	autor: z.string().min(3).optional(),
	data_apresentacao: z
		.string()
		.regex(/^\d{2}\/\d{2}\/\d{4}$/)
		.optional(),
	deliberacao: z.array(z.enum(['acolhida', 'acolhida parcialmente', 'rejeitada', 'retirada'])).optional(),
});

export type FilterOptions = z.infer<typeof filterOptionsSchema>;

export const findParamsSchema = z.object({
	mergePdf: z.boolean().optional(),
	filter: filterOptionsSchema.optional(),
});

export type FindParams = z.infer<typeof findParamsSchema>;
