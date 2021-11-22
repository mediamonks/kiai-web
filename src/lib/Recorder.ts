/* eslint-disable max-statements */
/* eslint-disable max-len */
import PipeSource from './PipeSource';

type TRecorderOptions = {
	bufferSize?: number;
	sampleRate?: number;
	channelCount?: number;
	publishFrequency?: number;
};

const defaultOptions: TRecorderOptions = {
	bufferSize: 1024,
	sampleRate: 44100,
	channelCount: 1,
	publishFrequency: 200,
};

export default class Recorder extends PipeSource {
	private readonly options: TRecorderOptions;
	private isRecording: boolean = false;
	private micStream: MediaStream;
	private animationID: number;

	constructor(options: TRecorderOptions = {}) {
		super();

		this.options = { ...defaultOptions, ...options };
	}

	private listen(analyser: AnalyserNode, data: Float32Array) {
		analyser.getFloatFrequencyData(data);
		const positiveData = data.map((frequency) => Math.abs(frequency) / 200);
		this.publish(positiveData);
		this.animationID = requestAnimationFrame(() => this.listen(analyser, data));
	}

	public async start(): Promise<void> {
		if (!this.micStream) {
			this.micStream = await navigator.mediaDevices.getUserMedia({
				video: false,
				audio: {
					sampleRate: this.options.sampleRate,
					channelCount: this.options.channelCount,
				},
			});
		}
		if (!this.isRecording) {
			const context = new AudioContext();
			const source = context.createMediaStreamSource(this.micStream);
			const analyser = context.createAnalyser();
			const data = new Float32Array(analyser.frequencyBinCount);
			analyser.fftSize = this.options.bufferSize * 2;
			source.connect(analyser);
			this.animationID = requestAnimationFrame(() => this.listen(analyser, data));
		}
		this.isRecording = true;
	}

	public stop(): void {
		cancelAnimationFrame(this.animationID);
		this.isRecording = false;
	}
}
