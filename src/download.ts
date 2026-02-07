import * as fs from 'node:fs';
import * as path from 'node:path';
import type TaskTree from 'tasktree-cli';

interface DownloadOptions {
	url: string;
	outputPath: string;
	filename: string;
	task: ReturnType<TaskTree['add']>;
	onProgress?: (downloaded: number, total: number, percentage: number) => void;
}

const tpl = ':bar {cyan.bold :percent} :etas :filename';

export const downloadFile = async (options: DownloadOptions): Promise<void> => {
	const { url, outputPath, task, filename, onProgress } = options;

	try {
		// Fetch the file
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Get content length
		const contentLength = response.headers.get('content-length');
		const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

		const bar = task.bar(tpl, { total: totalBytes });

		if (!response.body) {
			throw new Error('Response body is null or undefined');
		}

		// Ensure output directory exists
		const dir = path.dirname(outputPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// Create write stream
		const fileStream = fs.createWriteStream(`${outputPath}/${filename}`);
		const reader = response.body.getReader();

		let currentChunk = 0;
		let downloadedBytes = 0;

		// Read stream chunks
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			// Write chunk to file
			fileStream.write(value);
			downloadedBytes += value.length;

			// Calculate progress
			const percentage = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;

			// Update task tree
			if (totalBytes > 0) {
				bar.tick(downloadedBytes - currentChunk, { filename });
				currentChunk = downloadedBytes;
			}

			// Call progress callback if provided
			if (onProgress) {
				onProgress(downloadedBytes, totalBytes, percentage);
			}
		}

		// Close the file stream
		await new Promise<void>((resolve, reject) => {
			fileStream.end(() => {
				bar.complete();
				resolve();
			});
			fileStream.on('error', reject);
		});
	} catch (error) {
		// biome-ignore lint/complexity/noUselessCatch: nonsense
		throw error;
	}
};
