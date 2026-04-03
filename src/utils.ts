import * as fs from 'node:fs';
import kleur from 'kleur';
import PDFMerger from 'pdf-merger-js';
import { DEFAULT_RESULTS_FOLDER } from './config.ts';
import { type Emenda, emendaSchema } from './type.ts';

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const toSafeFilename = (string: string): string =>
	string
		.replaceAll(/[/\\:*?"<>|]/g, '_')
		.replaceAll(/ +/g, '_')
		.toLowerCase();

/**
 * Save emendas to JSON file
 */
export const saveToJson = (emendas: Emenda[], filename: string = 'emendas.json'): void => {
	fs.writeFileSync(filename, JSON.stringify(emendas, null, 2), 'utf-8');
	console.log(kleur.green(`Saved ${emendas.length} emendas to ${filename}`));
};

/**
 * Save emendas to CSV file
 */
export const saveToCsv = (emendas: Emenda[], filename: string) => {
	if (emendas.length === 0) {
		console.log(kleur.yellow('No emendas to save'));
		return;
	}

	const headers = Object.keys(emendaSchema.shape);
	const csvRows = [headers.join(',')];

	emendas.forEach((emenda) => {
		const row = headers.map((header) => {
			const value = emenda[header as keyof Emenda] || '';
			// Escape quotes and wrap in quotes if contains comma or quote
			const escaped = value.replaceAll(/"/g, '""');
			return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
		});
		csvRows.push(row.join(','));
	});

	fs.writeFileSync(filename, csvRows.join('\n'), 'utf-8');
	console.log(kleur.green(`Saved ${emendas.length} emendas to ${filename}`));
};

type GetPdfFilesFilterParams = (pdf: string) => boolean;

export const getPdfFiles = (materia: string, filter?: GetPdfFilesFilterParams) => {
	const pdfFiles = fs.readdirSync(`${DEFAULT_RESULTS_FOLDER}/${materia}/pdfs`);
	if (filter) return pdfFiles.filter(filter);
	return pdfFiles;
};

/**
 * Merge PDFs
 */

type MergePdfParams = {
	pdfPath: string[];
	targetPath: string;
	title: string;
};

export const mergePdfs = async (params: MergePdfParams) => {
	const { pdfPath: sourcePath, targetPath, title } = params;

	const merger = new PDFMerger();

	for (const path of sourcePath) {
		console.log(`Merging ${path}`);
		await merger.add(path);
	}

	// Set metadata
	await merger.setMetadata({ title });

	try {
		await merger.save(targetPath); //save under given name and reset the internal document
	} catch (error) {
		console.error(`Error saving ${targetPath}:`, error);
	}
};
