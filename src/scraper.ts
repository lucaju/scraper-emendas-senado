import * as fs from 'node:fs';
import * as cheerio from 'cheerio';
import kleur from 'kleur';
import ora from 'ora';
import TaskTree from 'tasktree-cli';
import { downloadFile } from './download.ts';

interface Emenda {
	id: string;
	autor: string;
	data: string;
	descricao?: string;
	acaoLegislativa?: string;
	pdfLink?: string | undefined;
	pdfFilename?: string;
}

const resultsFolder = 'resultados';

/**
 * Main function
 */
export const scrapeEmendas = async (materia: string): Promise<void> => {
	const url = `https://www25.senado.leg.br/web/atividade/materias/-/materia/${materia}`;

	console.log(`${`Materia: ${kleur.bold(materia)}`}`);
	console.log(kleur.blue(`   url: ${url}\n`));

	const spinner = ora(kleur.cyan('Scraping emendas')).start();

	try {
		const emendas = await processPage(url);

		spinner.succeed(kleur.cyan(`Numero de emendas encontradas: ${emendas.length}`));
		spinner.stop();
		spinner.clear();

		fs.mkdirSync(`${resultsFolder}/${materia}`, { recursive: true });
		fs.mkdirSync(`${resultsFolder}/${materia}/pdfs`, { recursive: true });

		const tree = TaskTree.tree();
		tree.start();

		const task = tree.add('Downloading PDFs');

		for (const emenda of emendas) {
			if (emenda.pdfLink) {
				const pdfFilename = emenda.id.replace('/', '_').replace(/ /g, '_').toLowerCase().concat('.pdf');

				const pdfDownloaded = await downloadFile({
					url: emenda.pdfLink,
					outputPath: `${resultsFolder}/${materia}/pdfs`,
					filename: pdfFilename,
					task,
				}).catch((error) => {
					console.error(kleur.red(`Failed to download PDF for emenda ${emenda.id}:`), error);
					return false;
				});

				if (pdfDownloaded) {
					emenda.pdfFilename = pdfFilename;
				}
			}
		}

		task.complete();
		tree.stop();
		tree.exit();

		// Save to both JSON and CSV
		console.log('\n');
		saveToJson(emendas, `${resultsFolder}/${materia}/emendas.json`);
		saveToCsv(emendas, `${resultsFolder}/${materia}/emendas.csv`);

		// Print first few for verification
		if (emendas.length > 0) {
			console.log(kleur.cyan('\nFirst 3 emendas:'));
			emendas.slice(0, 3).forEach((emenda, i) => {
				console.log(`\n${i + 1}. ${emenda.id}`);
				console.log(kleur.blue(`   Autor: ${emenda.autor}`));
				console.log(kleur.blue(`   Data: ${emenda.data}`));
				console.log(kleur.blue(`   Descrição: ${emenda.descricao?.substring(0, 100) || ''}`));
				console.log(kleur.blue(`   PDF: ${emenda.pdfFilename ?? 'N/A'}`));
			});
		}
	} catch (error) {
		console.error(kleur.red('Error scraping emendas:'), error);
		if (error instanceof Error) {
			console.error(error.stack);
		}
	}
};

/**
 * Scrape all amendments from the Senate page
 */
const processPage = async (url: string): Promise<Emenda[]> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const html = await response.text();
	const $ = cheerio.load(html);

	const emendas: Emenda[] = [];

	const emendasContainer = $('div#materia_documentos_emendas');

	const emendasList = emendasContainer.find('div.sf-texto-materia');

	for (const element of emendasList.toArray()) {
		const $element = $(element);

		const dts = $element.find('dt').toArray();
		const $dds = $element.find('dd');
		const $apdf = $element.find('.sf-texto-materia--link');

		const idIndex = dts.findIndex((dt) => ['Identificação:', 'Identificacao:'].includes($(dt).text().trim()));
		const autorIndex = dts.findIndex((dt) => ['Autor:', 'Autora:'].includes($(dt).text().trim()));
		const dataIndex = dts.findIndex((dt) => ['Data:', 'Data da Apresentação:'].includes($(dt).text().trim()));
		const descricaoIndex = dts.findIndex((dt) => ['Descrição:', 'Descricao:', 'Ementa:'].includes($(dt).text().trim()));
		const acaoLegislativaIndex = dts.findIndex((dt) =>
			['Ação Legislativa:', 'Acao Legislativa:'].includes($(dt).text().trim()),
		);

		if (idIndex === -1 || autorIndex === -1 || dataIndex === -1) {
			// console.log(kleur.red('Alguns obrigatórios campos não encontrados:'));
			continue;
		}

		const id = $dds.eq(idIndex).text().trim();
		const autor = $dds.eq(autorIndex).text().trim();
		const data = $dds.eq(dataIndex).text().trim();
		const descricao = $dds.eq(descricaoIndex).text().trim();
		const acaoLegislativa = $dds.eq(acaoLegislativaIndex).text().trim();

		if (id === '' || autor === '' || data === '') {
			// console.log(kleur.red('Alguns campos obrigatórios não encontrados:'));
			continue;
		}

		const pdfLink = $apdf.attr('href')?.trim();

		const emenda: Emenda = {
			id,
			autor,
			data,
			descricao,
			acaoLegislativa,
			pdfLink,
		};

		emendas.push(emenda);
	}

	process.stdout.write('\n');

	return emendas;
};

/**
 * Save emendas to JSON file
 */
const saveToJson = (emendas: Emenda[], filename: string = 'emendas.json'): void => {
	fs.writeFileSync(filename, JSON.stringify(emendas, null, 2), 'utf-8');
	console.log(kleur.green(`Saved ${emendas.length} emendas to ${filename}`));
};

/**
 * Save emendas to CSV file
 */
const saveToCsv = (emendas: Emenda[], filename: string = 'emendas.csv'): void => {
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
