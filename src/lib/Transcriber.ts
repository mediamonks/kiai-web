import PipeSource from './PipeSource';

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
	private readonly recognition: SpeechRecognition = new SpeechRecognition();
	// private readonly grammarList: SpeechGrammarList = new SpeechGrammarList();

	private isTranscribing: boolean = false;
	private resolver: () => void;

	constructor(options: TTranscriberOptions = {}) {
		super();

		const opts = { ...defaultOptions, ...options };

		// const words = ['addrivat'];
		//
		// const grammar = '#JSGF V1.0; grammar colors; public <color> = ' + words.join(' | ') + ' ;';
		//
		// this.grammarList.addFromString(grammar, 1);
		// this.recognition.grammars = this.grammarList;
		this.recognition.lang = opts.language;
		this.recognition.interimResults = opts.interimResults;
		this.recognition.continuous = true;
		this.recognition.maxAlternatives = opts.maxAlternatives;
		this.recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
			this.publish(Array.from(event.results).pop());
		});
		// this.recognition.addEventListener('speechend', () => {
		// this.recognition.stop();
		// });
		// this.recognition.addEventListener('nomatch', () => {
		// 	console.warn('no match');
		// });
		this.recognition.addEventListener('error', event => {
			console.error(event.error);
		});

		this.recognition.addEventListener('start', () => {
			this.isTranscribing = true;
			if (this.resolver) this.resolver();
			delete this.resolver;
		});
		this.recognition.addEventListener('end', () => {
			this.isTranscribing = false;
			if (this.resolver) this.resolver();
			delete this.resolver;
		});
	}

	public start(): Promise<void> {
		if (this.isTranscribing) return Promise.reject();
		
		return new Promise(resolve => {
			this.resolver = resolve;
			this.recognition.start();
		});
	}

	public stop(): Promise<void> {
		if (!this.isTranscribing) return Promise.resolve();
		
		return new Promise(resolve => {
			this.resolver = resolve;
			this.recognition.stop();
		});
	}
}
