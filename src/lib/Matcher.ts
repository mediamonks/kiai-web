/*
	Needs rework
 */
import { sample } from 'lodash';
import { IPipeDestination, TIntents } from './types';
import PipeSource from './PipeSource';

export default class Matcher extends PipeSource implements IPipeDestination {
	private readonly intents: TIntents;

	private language: string;

	public constructor({ intents, language }: { intents: TIntents; language: string }) {
		super();

		this.intents = intents;
		this.language = language;
	}

	public receive(data: any): void {
		const intent = data.intent || this.match(data.transcript);

		if (intent) this.publish(intent);
	}

	public setLanguage(language: string): void {
		this.language = language;
	}

	private match(input: string, context?: string): string {
		const matches = Object.keys(this.intents).filter(intentName => {
			const intent = this.intents[intentName];

			if (context && !intent.contexts.includes(context)) return false;

			// TODO: properly replace variables in phrase with capture group to match against entity values
			return Boolean(intent.phrases[this.language].find(
				phrase => new RegExp(`.*${phrase}.*`, 'u').test(input),
			));
		});

		return (matches.length && sample(matches)) || '';
	}
}
