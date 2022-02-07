/*
	Combines the Recorder, AmplitudeMeter, SignalTrigger, ChunkBuffer and Transcriber to provide a speech-to-text interface
 */
import PipeSource from './PipeSource';
import Recorder from './Recorder';
import SignalTrigger from './SignalTrigger';
import ChunkBuffer from './ChunkBuffer';
import Transcriber from './Transcriber';
import AmplitudeMeter from './AmplitudeMeter';

type TVoiceInputOptions = {
	apiKey?: string,
	language?: string,
	inputThreshold?: number;
	silenceDelay?: number;
	timeout?: number;
};

export default class VoiceInput extends PipeSource {
	private readonly recorder: Recorder;
	private timeout: number;
	private inputDetected: boolean;
	protected readonly defaultOptions: TVoiceInputOptions = {
		language: 'en-US',
		inputThreshold: 0.1,
		silenceDelay: 500,
		timeout: 12000,
	};

	public constructor(options: TVoiceInputOptions) {
		super(options);

		const { apiKey, language, inputThreshold, silenceDelay } = this.options as TVoiceInputOptions;

		this.recorder = new Recorder();
		const buffer = new ChunkBuffer();
		const amplitudeMeter = new AmplitudeMeter();
		const inputTrigger = new SignalTrigger({ delay: 0, threshold: inputThreshold });
		const silenceTrigger = new SignalTrigger({ delay: silenceDelay, threshold: inputThreshold });
		const transcriber = new Transcriber({ apiKey, language });

		this.recorder.pipe(amplitudeMeter);

		amplitudeMeter.pipe(inputTrigger).pipe(inputState => {
			if (!inputState || this.inputDetected) return;
			this.inputDetected = true;
			window.clearTimeout(this.timeout);
		});

		amplitudeMeter.pipe(silenceTrigger).pipe(inputState => {
			if (inputState) return;
			if (this.inputDetected) {
				this.stop();
				buffer.flush();
			} else {
				buffer.clear();
			}
		});

		this.recorder
			.pipe(buffer)
			.pipe(transcriber)
			.pipe(text => this.publish(text));
	}

	public async listen(): Promise<void> {
		const { timeout } = this.options as TVoiceInputOptions;
		await this.recorder.start();
		this.emit('started');
		this.timeout = window.setTimeout(() => this.stop(), timeout)
	}

	public stop(): void {
		this.recorder.stop();
		this.inputDetected = false;
		this.emit('stopped');
	}
}
