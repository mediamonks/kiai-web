/*
	Needs work
 */
import mapValues from 'lodash/mapValues';
import PipeSource from './PipeSource';
import { IPipeDestination } from './types';
import { findMatch } from './utils';

type TTriggerOptions = {
	triggers?: {
		[key: string]: {
			matches: Array<string>;
			action: () => void | Promise<void>;
			suppressOutput?: boolean;
		};
	};
	partial?: boolean;
	suppressOutput?: boolean;
	fallback?: () => void;
};

export default class Trigger extends PipeSource implements IPipeDestination {
	public receive(text: string): void {
		const { triggers, fallback, partial, suppressOutput } = this.options as TTriggerOptions;

		const key = findMatch(
			text,
			mapValues(triggers, trigger => trigger.matches),
			partial,
		);
		if (!key && this.options.fallback) fallback();
		if (!key) {
			this.publish(text);
			return;
		}

		const matchedTrigger = triggers[key];
		const suppress =
			matchedTrigger.suppressOutput ||
			(matchedTrigger.suppressOutput === undefined && suppressOutput);

		Promise.resolve(matchedTrigger.action()).then(() => {
			if (suppress) return;

			this.publish(text);
		});
	}
}
