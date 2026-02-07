import fs from 'node:fs';
import kleur from 'kleur';
import { argv } from './argv.ts';
import { Inquerer } from './inquerer.ts';
import { scrapeEmendas } from './scraper.ts';

export interface Config {
	materia: string;
}

const initSetup = async () => {
	if (argv.materia) {
		return argv.materia;
	} else {
		const configFromFile = await fs.promises.readFile('./config.json', 'utf8');
		const config = configFromFile ? (JSON.parse(configFromFile) as unknown as Config) : await Inquerer();
		return config.materia;
	}
};

void (async () => {
	const materia = await initSetup();
	if (!materia) {
		console.error(kleur.red('Nenhuma matéria fornecida.'));
		return;
	}
	await scrapeEmendas(materia);
})();
