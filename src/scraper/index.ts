import * as fs from 'node:fs';
import kleur from 'kleur';
import { DEFAULT_RESULTS_FOLDER } from '../config.ts';
import { getPdfFiles, mergePdfs, saveToCsv, saveToJson } from '../utils.ts';
import { download } from './download.ts';
import { parsing } from './parsing.ts';
import { scrapeEmendas } from './scraper.ts';
import { initSetup } from './setup/index.ts';

void (async () => {
	try {
		const { materia, skipDownloadPdf = false, mergePdf = false } = await initSetup();
		if (!materia) {
			console.error(kleur.red('Nenhuma matéria fornecida.'));
			process.exitCode = 1;
			return;
		}

		const emendas = await scrapeEmendas(materia, { log: true });
		if (!emendas) process.exitCode = 1;

		//parsingg
		const parsedEmendas = await parsing(emendas);

		// Save to both JSON and CSV
		console.log('\n');
		fs.mkdirSync(`${DEFAULT_RESULTS_FOLDER}/${materia}`, { recursive: true });
		saveToJson(parsedEmendas, `${DEFAULT_RESULTS_FOLDER}/${materia}/emendas.json`);
		saveToCsv(parsedEmendas, `${DEFAULT_RESULTS_FOLDER}/${materia}/emendas.csv`);

		// Download PDFs
		if (!skipDownloadPdf) {
			await download(materia, parsedEmendas);
		}

		// Merge PDFs
		if (mergePdf) {
			const pdfFiles = getPdfFiles(materia);
			if (pdfFiles.length < 2) return;

			await mergePdfs({
				pdfPath: pdfFiles.map((pdf) => `${DEFAULT_RESULTS_FOLDER}/${materia}/pdfs/${pdf}`),
				targetPath: `${DEFAULT_RESULTS_FOLDER}/${materia}/combined_output.pdf`,
				title: `Emendas do PL ${materia}`,
			});
		}
	} catch (error) {
		console.error(kleur.red('Erro:'), error);
		process.exitCode = 1;
	}
})();
