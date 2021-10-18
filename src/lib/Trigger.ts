import mapValues from 'lodash/mapValues';
import PipeSource from './PipeSource';
import { IPipeDestination } from './types';
import { findMatch } from './utils';

type TTriggerOptions = {
	triggers: {
		[key: string]: {
			matches: string[];
			action: () => void | Promise<void>;
			suppressOutput?: boolean;
		};
	};
	partial?: boolean;
	suppressOutput?: boolean;
	fallback?: () => void;
};

export default class Trigger extends PipeSource implements IPipeDestination {
	private options: TTriggerOptions;

	constructor(options: TTriggerOptions) {
		super();

		this.options = options;
	}

	public receive(text: string) {
		const key = findMatch(
			text,
			mapValues(this.options.triggers, trigger => trigger.matches),
			this.options.partial,
		);
		if (!key && this.options.fallback) this.options.fallback();
		if (!key) return this.publish(text);

		const matchedTrigger = this.options.triggers[key];
		const suppress =
			matchedTrigger.suppressOutput ||
			(matchedTrigger.suppressOutput === undefined && this.options.suppressOutput);

		Promise.resolve(matchedTrigger.action()).then(() => {
			if (suppress) return;

			this.publish(text);
		});
	}
}
