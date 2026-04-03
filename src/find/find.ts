import * as fs from 'node:fs';
import kleur from 'kleur';
import { DEFAULT_RESULTS_FOLDER } from '../config.ts';
import { emendaSchema, type FilterOptions } from '../type.ts';

export const find = async (materia: string, filter?: FilterOptions) => {
	const raw = await fs.promises.readFile(`${DEFAULT_RESULTS_FOLDER}/${materia}/emendas.json`, 'utf8');
	const emendas = emendaSchema.array().parse(JSON.parse(raw));

	let folderName = 'filtro';

	let filteredEmendas = emendas;
	if (filter) {
		if (filter.autor) {
			const autorFilter = filter.autor.toLowerCase();
			folderName += `-${autorFilter}`;
			filteredEmendas = filteredEmendas.filter(({ autor }) => autor.toLowerCase().includes(autorFilter));
		}
		if (filter.data) {
			const dataFilter = filter.data;
			folderName += `-${dataFilter}`;
			filteredEmendas = filteredEmendas.filter(({ data }) => data === dataFilter);
		}
		if (filter.deliberacao) {
			const deliberacaoFilter = filter.deliberacao.toLowerCase();
			folderName += `-${deliberacaoFilter}`;
			filteredEmendas = filteredEmendas.filter(({ deliberacao }) =>
				deliberacao?.toLowerCase().includes(deliberacaoFilter),
			);
		}
	}

	if (filteredEmendas.length === 0) {
		console.log(kleur.red('Nenhuma emenda encontrada com os filtros informados'));
		process.exitCode = 1;
		return;
	}

	return { filteredEmendas, folderName };
};
