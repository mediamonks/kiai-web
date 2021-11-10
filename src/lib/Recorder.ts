import PipeSource from './PipeSource';

type TRecorderOptions = {
	bufferSize?: number;
	sampleRate?: number;
	channelCount?: number;
};

const defaultOptions: TRecorderOptions = {
	bufferSize: 1024,
	sampleRate: 44100,
	channelCount: 1,
};

export default class Recorder extends PipeSource {
	private readonly options: TRecorderOptions;
	private isRecording: boolean = false;
	private micStream: MediaStream;
	private mediaRecorder: MediaRecorder;

	constructor(options: TRecorderOptions = {}) {
		super();

		this.options = { ...defaultOptions, ...options };
	}

	public async start(): Promise<void> {
		if (!this.micStream) {
			this.micStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: this.options.sampleRate,
					channelCount: this.options.channelCount,
				},
			});
		}

		if (!this.mediaRecorder) {
			this.mediaRecorder = new MediaRecorder(this.micStream);

			this.mediaRecorder.ondataavailable = event => {
				if (!this.isRecording) return;
				this.publish(event.data);
			};
		}

		this.mediaRecorder.start();
		this.isRecording = true;
	}

	public stop(): void {
		if (!this.mediaRecorder) return;
		this.mediaRecorder.stop();
		this.isRecording = false;
	}
}
