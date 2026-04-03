import * as fs from 'node:fs';
import * as path from 'node:path';
import kleur from 'kleur';
import TaskTree from 'tasktree-cli';
import { DEFAULT_RESULTS_FOLDER } from '../config.ts';
import type { Emenda } from '../type.ts';
import { toSafeFilename } from '../utils.ts';
import { fetchWithRetry } from './http.ts';

const TPL = ':bar {cyan.bold :percent} :etas :filename';

/**
 * Download PDFs
 */
export const download = async (materia: string, emendas: Emenda[]) => {
	fs.mkdirSync(`${DEFAULT_RESULTS_FOLDER}/${materia}/pdfs`, { recursive: true });

	const tree = TaskTree.tree();
	tree.start();

	const task = tree.add('Downloading PDFs');

	for (const emenda of emendas) {
		if (!emenda.pdfLink) continue;

		const pdfFilename = `${toSafeFilename(emenda.id)}.pdf`;

		const pdfDownloaded = await downloadFile(emenda.pdfLink, {
			outputPath: `${DEFAULT_RESULTS_FOLDER}/${materia}/pdfs`,
			filename: pdfFilename,
			task,
		}).catch((error) => {
			console.error(kleur.red(`Failed to download PDF for emenda ${emenda.id}:`), error);
			return null;
		});

		if (pdfDownloaded) emenda.pdfFilename = pdfFilename;
	}

	task.complete();
	tree.stop();
	tree.exit();
};

/**
 * Download file
 */
type DownloadOptions = {
	outputPath: string;
	filename: string;
	task: ReturnType<TaskTree['add']>;
	onProgress?: (downloaded: number, total: number, percentage: number) => void;
};

const downloadFile = async (url: string, options: DownloadOptions) => {
	const { outputPath, task, filename, onProgress } = options;

	// Fetch the file
	const response = await fetchWithRetry(url);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	// Get content length
	const contentLength = response.headers.get('content-length');
	const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

	const bar = task.bar(TPL, { total: totalBytes });

	if (!response.body) {
		throw new Error('Response body is null or undefined');
	}

	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true });
	}

	const filePath = path.join(outputPath, filename);
	const fileStream = fs.createWriteStream(filePath);
	const reader = response.body.getReader();

	let currentChunk = 0;
	let downloadedBytes = 0;

	// Read stream chunks
	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		fileStream.write(value);
		downloadedBytes += value.length;

		const percentage = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;

		if (totalBytes > 0) {
			bar.tick(downloadedBytes - currentChunk, { filename });
			currentChunk = downloadedBytes;
		}

		if (onProgress) {
			onProgress(downloadedBytes, totalBytes, percentage);
		}
	}

	return await new Promise<boolean>((resolve, reject) => {
		fileStream.once('error', (err) => {
			reject(err);
		});
		fileStream.end(() => {
			bar.complete();
			resolve(true);
		});
	});
};
