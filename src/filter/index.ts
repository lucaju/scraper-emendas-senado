import * as fs from 'node:fs';
import kleur from 'kleur';
import { DEFAULT_RESULTS_FOLDER } from '../config.ts';
import { getPdfFiles, mergePdfs, saveToCsv, saveToJson } from '../utils.ts';
import { filterData } from './filter-data.ts';
import { initSetup } from './setup/index.ts';

void (async () => {
	try {
		const { materia, mergePdf, filter } = await initSetup();
		if (!materia) {
			console.error(kleur.red('Nenhuma matéria fornecida.'));
			process.exitCode = 1;
			return;
		}

		const data = await filterData(materia, filter);
		if (!data) {
			console.error(kleur.red('Erro ao filtrar dados.'));
			process.exitCode = 1;
			return;
		}

		const folderMateria = `${DEFAULT_RESULTS_FOLDER}/${materia}`;

		// Save to both JSON and CSV
		console.log('\n');
		fs.mkdirSync(`${folderMateria}/${data.folderName}`, { recursive: true });
		saveToJson(data.filteredEmendas, `${folderMateria}/${data.folderName}/emendas.json`);
		saveToCsv(data.filteredEmendas, `${folderMateria}/${data.folderName}/emendas.csv`);

		if (mergePdf) {
			const pdfFiles = getPdfFiles(materia, (pdf: string) =>
				data.filteredEmendas.some((emenda) => emenda.pdfFilename === pdf),
			);

			if (pdfFiles.length < 2) return;

			await mergePdfs({
				pdfPath: pdfFiles.map((pdf) => `${folderMateria}/pdfs/${pdf}`),
				targetPath: `${folderMateria}/${data.folderName}/combined_output.pdf`,
				title: `Emendas do PL ${materia}: ${data.folderName.replaceAll('-', ' ')}`,
			});
		}
	} catch (error) {
		console.error(kleur.red('Erro:'), error);
		process.exitCode = 1;
	}
})();
