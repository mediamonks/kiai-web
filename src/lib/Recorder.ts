import PipeSource from './PipeSource';

type TRecorderOptions = {
	bufferSize?: number;
	sampleRate?: number;
	channelCount?: number;
	audioContext?: AudioContext;
};

const defaultOptions: TRecorderOptions = {
	bufferSize: 1024,
	sampleRate: 44100,
	channelCount: 1,
};

export default class Recorder extends PipeSource {
	private readonly audioContext: AudioContext;
	private readonly scriptProcessor: ScriptProcessorNode;

	private isRecording: boolean = false;

	constructor(options: TRecorderOptions = {}) {
		super();

		const opts = { ...defaultOptions, ...options };

		this.audioContext = opts.audioContext || new AudioContext();

		const analyser = this.audioContext.createAnalyser();

		this.scriptProcessor = this.audioContext.createScriptProcessor(opts.bufferSize, 1, 1);
		this.isRecording = false;

		this.scriptProcessor.onaudioprocess = event => {
			if (!this.isRecording) return;

			const audio = event.inputBuffer.getChannelData(0);

			this.publish(audio);
		};

		this.scriptProcessor.connect(this.audioContext.destination);

		navigator.mediaDevices
			.getUserMedia({
				audio: {
					sampleRate: opts.sampleRate,
					channelCount: opts.channelCount,
				},
			})
			.then(micStream => {
				const micSource = this.audioContext.createMediaStreamSource(micStream);
				micSource.connect(this.scriptProcessor);
				micSource.connect(analyser);
			})
			.catch(error => {
				throw new Error(error);
			});
	}

	public start(): void {
		this.isRecording = true;
	}

	public stop(): void {
		this.isRecording = false;
	}
}
