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
	private mediaRecorder: MediaRecorder;
	private buffer: AudioBuffer;

	constructor(options: TRecorderOptions = {}) {
		super();

		this.options = { ...defaultOptions, ...options };
		this.buffer = new AudioBuffer({
			length: this.options.bufferSize,
			sampleRate: this.options.sampleRate,
		});
	}

	private setAudioBufferFromBlob(data: Blob) {
		const ctx = new AudioContext();
		const request = new XMLHttpRequest();
		const url = URL.createObjectURL(data);
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';
		request.onload = async () => {
			console.debug('response:', request.response);
			this.buffer = await ctx.decodeAudioData(
				request.response.slice(0),
				(audioBuffer) => audioBuffer,
			);
		};
		request.send();
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

		if (!this.mediaRecorder && this.micStream) {
			this.mediaRecorder = new MediaRecorder(this.micStream, {
				mimeType: 'audio/webm;codecs=opus',
			});

			this.mediaRecorder.ondataavailable = (event) => {
				if (!this.isRecording) return;
				this.setAudioBufferFromBlob(event.data);
				console.debug('buffer:', this.buffer);
				this.publish(this.buffer.getChannelData(0));
			};
		}

		if (!this.isRecording) {
			this.mediaRecorder.start(this.options.publishFrequency);
			this.isRecording = true;
		}
	}

	public stop(): void {
		if (!this.mediaRecorder) return;
		if (this.isRecording) {
			this.mediaRecorder.stop();
		}
		this.isRecording = false;
	}
}
