import fs from 'node:fs';
import type { Emenda } from '../type.ts';

export const parsing = async (emendas: Emenda[]) => {
	const tendenciasRAw = await fs.promises.readFile('./src/partido-tendencia.csv', 'utf8');
	const tendencias = csvToMap(tendenciasRAw);

	for (const emenda of emendas) {
		const partidoEstado = emenda.autor.match(/\(([^)]+)\)/);
		emenda.partido = partidoEstado?.[0]?.split('/')[0]?.replace('(', '');
		emenda.estado = partidoEstado?.[0]?.split('/')[1]?.replace(')', '');
		if (emenda.partido) emenda.tendencia = tendencias.get(emenda.partido);

		if (emenda.historicoDeliberacao) {
			const parts = emenda.historicoDeliberacao.split(' - ');
			emenda.deliberacao = parts[0]?.trim();
			emenda.deliberacaoLocal = parts[1]?.trim();
			emenda.deliberacaoData = parts[2]?.trim();
		}
	}

	return emendas;
};

/**
 * @param {string} csv - full file contents, lines separated by \n
 * @param {{ skipHeader?: boolean }} [opts]
 * @returns {Map<string, string>}
 */

interface CsvToMapOptions {
	skipHeader?: boolean;
	delimiter?: string;
}

const csvToMap = (csv: string, opts: CsvToMapOptions = { skipHeader: true }) => {
	const lines = csv
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);

	const rows = opts.skipHeader ? lines.slice(1) : lines;

	return new Map(
		rows.map((line: string) => {
			const i = line.indexOf(opts?.delimiter ?? ',');
			if (i === -1) throw new Error(`Invalid CSV line (no delimiter): ${line}`);
			const key = line.slice(0, i).trim();
			const value = line.slice(i + 1).trim();
			return [key, value];
		}),
	);
};
