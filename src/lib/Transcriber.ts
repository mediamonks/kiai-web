import PipeSource from './PipeSource';
import { SpeechRecognitionEvent } from './types';

// @ts-ignore
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// @ts-ignore
window.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

type TTranscriberOptions = {
	language?: string;
	maxAlternatives?: number;
	minConfidence?: number;
	interimResults?: boolean;
};

const defaultOptions: TTranscriberOptions = {
	language: 'en-US',
	maxAlternatives: 1,
	minConfidence: 0,
	interimResults: false,
};

export default class Transcriber extends PipeSource {
	// @ts-ignore
	private readonly recognition: SpeechRecognition;

	private isTranscribing: boolean = false;
	private resolver: () => void;
	private gotResult: boolean = false;
	private aborted: boolean = false;

	constructor(options: TTranscriberOptions = {}) {
		super();

		if (!('SpeechRecognition' in window)) throw new Error('Web Speech API not supported');

		// @ts-ignore
		this.recognition = new window.SpeechRecognition();

		const opts = { ...defaultOptions, ...options };

		this.recognition.lang = opts.language;
		this.recognition.interimResults = opts.interimResults;
		// this.recognition.continuous = true;
		this.recognition.maxAlternatives = opts.maxAlternatives;
		this.recognition.addEventListener('result', this.handleResult.bind(this));

		this.recognition.addEventListener('error', (event: SpeechRecognitionEvent) => {
			this.recognition.abort();
			// eslint-disable-next-line no-console
			console.error(event.error); // tslint:disable-line no-console
		});

		this.recognition.addEventListener('start', () => {
			this.isTranscribing = true;
			if (this.resolver) this.resolver();
			delete this.resolver;
			this.emit('started');
		});

		this.recognition.addEventListener('end', () => {
			this.isTranscribing = false;
			if (this.resolver) this.resolver();
			delete this.resolver;

			if (!this.gotResult && !this.aborted) this.emit('noresult');

			this.gotResult = false;
			this.emit('ended');
		});
	}

	public start(): Promise<void> {
		if (this.isTranscribing) return Promise.reject(new Error('Transcriber: already started'));
		this.aborted = false;

		return new Promise(resolve => {
			this.resolver = resolve;
			this.recognition.start();
		});
	}

	public stop(): Promise<void> {
		if (!this.isTranscribing) return Promise.resolve();
		this.aborted = true;

		return new Promise(resolve => {
			this.resolver = resolve;
			this.recognition.abort();
		});
	}

	private handleResult(event: SpeechRecognitionEvent) {
		const lastResult = Array.from(event.results).pop() as SpeechRecognitionResult;

		const combinedTranscript = Array.from(event.results).reduce((combined, result) => {
			const [{ transcript }] = Array.from(result).sort(
				// eslint-disable-next-line id-length
				(a: SpeechRecognitionAlternative, b: SpeechRecognitionAlternative) =>
					b.confidence - a.confidence,
			);

			return combined + transcript;
		}, '');

		this.emit('result', combinedTranscript);

		if (!lastResult.isFinal) return;

		this.gotResult = true;

		this.publish(combinedTranscript);
	}
}
