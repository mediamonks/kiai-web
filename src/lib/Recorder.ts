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

	public async start(): Promise<void> {
		async function decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
			const ctx = new AudioContext();
			const decodedAudio = await ctx.decodeAudioData(arrayBuffer, (audioBuffer) => audioBuffer);
			return decodedAudio;
		}

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

			this.mediaRecorder.ondataavailable = async (event) => {
				if (!this.isRecording) return;
				const request = new XMLHttpRequest();
				const url = URL.createObjectURL(event.data);
				request.open('GET', url, true);
				request.responseType = 'arraybuffer';
				// eslint-disable-next-line require-atomic-updates
				request.onload = async () => {
					console.debug('response:', request.response);
					this.buffer = await decodeAudio(request.response.slice(0));
				};
				request.send();
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
