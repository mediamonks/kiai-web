import { TOptions } from './types';
import EventEmitter from './EventEmitter';
import Context from './Context';

export default abstract class Node extends EventEmitter {
	protected readonly customOptions: TOptions;
	protected readonly defaultOptions: TOptions = {};

	public constructor(options: TOptions = {}) {
		super();

		this.customOptions = options;
	}

	protected get options(): TOptions {
		return { ...this.defaultOptions, ...this.customOptions };
	}

	protected get audioContext(): AudioContext {
		return (this.options.audioContext as AudioContext) || Context.get();
	}
}
