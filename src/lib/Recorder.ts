import PipeSource from './PipeSource';

type TRecorderOptions = {
	bufferSize?: number;
	sampleRate?: number;
	channelCount?: number;
	minDecibels?: number;
	maxDecibels?: number;
};

const defaultOptions: TRecorderOptions = {
	bufferSize: 1024,
	sampleRate: 44100,
	channelCount: 1,
	minDecibels: -100,
	maxDecibels: -30,
};

export default class Recorder extends PipeSource {
	private readonly options: TRecorderOptions;
	private isRecording: boolean = false;
	private animationId: number;
	private audioContext: AudioContext;
	private audioAnalyser: AnalyserNode;
	private stream: MediaStreamAudioSourceNode;

	constructor(options: TRecorderOptions = {}) {
		super();

		this.options = { ...defaultOptions, ...options };
	}

	private handlePublish() {
		const data = new Float32Array(this.audioAnalyser.frequencyBinCount);
		this.audioAnalyser.getFloatFrequencyData(data);
		this.publish(data);
		this.animationId = requestAnimationFrame(() => this.handlePublish());
	}

	public async start(): Promise<void> {
		if (!this.audioContext) {
			this.audioContext = new AudioContext();
		}

		if (!this.audioAnalyser) {
			this.audioAnalyser = this.audioContext.createAnalyser();
			this.audioAnalyser.fftSize = this.options.bufferSize * 2;
			this.audioAnalyser.minDecibels = this.options.minDecibels;
			this.audioAnalyser.maxDecibels = this.options.maxDecibels;
		}

		if (!this.stream) {
			const micStream = await navigator.mediaDevices.getUserMedia({
				video: false,
				audio: {
					sampleRate: this.options.sampleRate,
					channelCount: this.options.channelCount,
				},
			});
			this.stream = this.audioContext.createMediaStreamSource(micStream);
			this.stream.connect(this.audioAnalyser);
		}

		if (!this.isRecording) {
			this.handlePublish();
			this.isRecording = true;
		}
	}

	public stop(): void {
		if (this.isRecording) {
			cancelAnimationFrame(this.animationId);
			this.isRecording = false;
		}
	}
}
