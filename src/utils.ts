import * as fs from 'node:fs';
import kleur from 'kleur';
import type { Emenda } from './scraper.ts';

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
export const saveToCsv = (emendas: Emenda[], filename: string = 'emendas.csv'): void => {
	if (emendas.length === 0) {
		console.log(kleur.yellow('No emendas to save'));
		return;
	}

	const headers = ['id', 'autor', 'data', 'descricao', 'acaoLegislativa', 'pdfLink', 'pdfFilename'];
	const csvRows = [headers.join(',')];

	emendas.forEach((emenda) => {
		const row = headers.map((header) => {
			const value = emenda[header as keyof Emenda] || '';
			// Escape quotes and wrap in quotes if contains comma or quote
			const escaped = value.replace(/"/g, '""');
			return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
		});
		csvRows.push(row.join(','));
	});

	fs.writeFileSync(filename, csvRows.join('\n'), 'utf-8');
	console.log(kleur.green(`Saved ${emendas.length} emendas to ${filename}`));
};
