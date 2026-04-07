import * as cheerio from 'cheerio';
import kleur from 'kleur';
import ora from 'ora';
import { DEFAULT_BASE_URL } from '../config.ts';
import type { Emenda } from '../type.ts';
import { toSafeFilename } from '../utils.ts';
import { fetchWithRetry } from './http.ts';

/**
 * Main function. Returns false on scrape error or if any PDF	download failed.
 */
export const scrapeEmendas = async (materia: string, options?: { log?: boolean }) => {
	const { log = false } = options ?? {};
	const url = `${DEFAULT_BASE_URL}${materia}`;

	console.log(`Materia: ${kleur.bold(materia)}`);
	console.log(kleur.blue(`   url: ${url}\n`));

	const spinner = ora(kleur.cyan('Scraping emendas')).start();

	try {
		const emendas = await processPage(url);

		spinner.succeed(kleur.cyan(`Numero de emendas encontradas: ${emendas.length}`));
		spinner.stop();
		spinner.clear();

		// Print first few for verification
		if (log && emendas.length > 0) {
			console.log(kleur.cyan('\nFirst 3 emendas:'));
			emendas.slice(0, 3).forEach((emenda, i) => {
				console.log(`\n${i + 1}. ${emenda.id}`);
				console.log(kleur.blue(`   Autor: ${emenda.autor}`));
				console.log(kleur.blue(`   Data de apresentação: ${emenda.dataApresentacao}`));
				console.log(kleur.blue(`   Turno: ${emenda.turno}`));
				console.log(kleur.blue(`   Histórico: ${emenda.historicoDeliberacao}`));
				console.log(kleur.blue(`   PDF: ${emenda.pdfFilename ?? 'N/A'}`));
			});
		}

		return emendas;
	} catch (error) {
		spinner.fail(kleur.red('Falha ao obter emendas'));
		console.error(kleur.red('Error scraping emendas:'), error);
		if (error instanceof Error) {
			console.error(error.stack);
		}
		return [];
	}
};

/**
 * Scrape all amendments from the Senate page
 */
const processPage = async (url: string): Promise<Emenda[]> => {
	const response = await fetchWithRetry(url);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const html = await response.text();

	//** debug: save page HTML to file */
	// const htmlDir = `${DEFAULT_RESULTS_FOLDER}/${materia}`;
	// fs.mkdirSync(htmlDir, { recursive: true });
	// const htmlPath = `${htmlDir}/page.html`;
	// fs.writeFileSync(htmlPath, html, 'utf-8');
	// console.log(kleur.green(`Saved page HTML to ${htmlPath}`));

	const $ = cheerio.load(html);

	const emendas: Emenda[] = [];

	/** Accordion "Emendas": nested colegiado tables with class `tabela-emendas`. */
	const $rows = $('div#emendas table.tabela-emendas tbody tr');

	for (const row of $rows.toArray()) {
		const $tds = $(row).find('td');
		if ($tds.length < 5) continue;

		const $first = $tds.eq(0);
		const $link = $first.find('a[href]').first();
		const pdfLink = $link.attr('href')?.trim();
		const id = ($link.text() || $first.text()).trim();
		const autor = $tds.eq(1).text().trim();
		const data = $tds.eq(2).text().trim();
		const turno = $tds.eq(3).text().trim();
		const deliberacao = $tds.eq(4).text().trim();
		const pdfFilename = `${toSafeFilename(id)}.pdf`;

		if (!id || !autor || !data) continue;

		emendas.push({ id, autor, dataApresentacao: data, turno, historicoDeliberacao: deliberacao, pdfLink, pdfFilename });
	}

	return emendas;
};
