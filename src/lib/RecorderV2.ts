/*
	Records audio data from the microphone and publishes it, including time-domain and frequency data
	Uses audio analyser node for time-domain data but audio chunks come out distorted when played back
 */
import PipeSource from './PipeSource';

type TRecorderOptions = {
	bufferSize?: number;
	sampleRate?: number;
	channelCount?: number;
};

export default class RecorderV2 extends PipeSource {
	private isRecording: boolean = false;
	private publishTimer: number;
	private audioAnalyser: AnalyserNode;
	private stream: MediaStreamAudioSourceNode;
	protected readonly defaultOptions: TRecorderOptions = {
		bufferSize: 1024,
		sampleRate: 44100,
		channelCount: 1,
	};

	private schedulePublish(): void {
		cancelAnimationFrame(this.publishTimer);

		if (!this.isRecording) return;

		this.publishTimer = requestAnimationFrame(() => {
			this.publishData();
		});
	}

	private publishData(): void {
		if (!this.isRecording) return;

		const { audioAnalyser } = this;
		const { bufferSize } = this.options as TRecorderOptions;

		const timeDomain = new Float32Array(bufferSize);
		audioAnalyser.getFloatTimeDomainData(timeDomain);

		const frequency = new Float32Array(audioAnalyser.frequencyBinCount);
		audioAnalyser.getFloatFrequencyData(frequency);

		this.publish({ timeDomain, frequency });

		this.schedulePublish();
	}

	public async start(): Promise<void> {
		const { bufferSize, sampleRate, channelCount } = this.options as TRecorderOptions;

		if (!this.audioAnalyser) {
			this.audioAnalyser = this.audioContext.createAnalyser();
			this.audioAnalyser.fftSize = bufferSize * 2;
		}

		if (!this.stream) {
			const micStream = await navigator.mediaDevices.getUserMedia({
				video: false,
				audio: { sampleRate, channelCount },
			});
			this.stream = this.audioContext.createMediaStreamSource(micStream);
			this.stream.connect(this.audioAnalyser);
		}

		this.isRecording = true;

		this.schedulePublish();
	}

	public stop(): void {
		if (!this.isRecording) return;

		cancelAnimationFrame(this.publishTimer);
		this.isRecording = false;
	}
}
