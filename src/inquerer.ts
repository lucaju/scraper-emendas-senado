import { input } from '@inquirer/prompts';

export interface InquererProps {
	materia: string;
}

export const Inquerer = async () => {
	const result = {
		materia: await input({
			message: 'Numero da matéria',
			required: true,
			validate: (input: string) => input !== '',
		}),
	};

	return result;
};
