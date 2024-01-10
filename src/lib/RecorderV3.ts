/*
	Records audio timedomain data from the microphone and publishes it
 */
import PipeSource from './PipeSource';

type TRecorderOptions = {
	bufferSize?: number;
	sampleRate?: number;
	// channelCount?: number;
};

export default class RecorderV3 extends PipeSource {
	private isRecording: boolean = false;
	protected readonly defaultOptions: TRecorderOptions = {
		sampleRate: 44100,
		// channelCount: 1,
	};
	protected micStream: MediaStream;
	protected workletNode: AudioWorkletNode;

	public async start(): Promise<void> {
		// const { sampleRate, channelCount } = this.options as TRecorderOptions;
		const { sampleRate } = this.options as TRecorderOptions;

		// default sampleRate to this.audioContext.sampleRate

		if (!this.micStream) {
			this.micStream = await navigator.mediaDevices.getUserMedia({
				video: false,
				// audio: { sampleRate, channelCount },
				audio: { sampleRate, channelCount: 1 }, // TODO: use channelcount option, output multiple channels
			});
		}

		if (!this.workletNode) {
			await this.audioContext.audioWorklet.addModule('RecorderProcessor.js');

			const mediaStreamAudioSourceNode = this.audioContext.createMediaStreamSource(this.micStream);
			this.workletNode = new AudioWorkletNode(
				this.audioContext,
				'recorder-processor'
			);
			mediaStreamAudioSourceNode.connect(this.workletNode);
		}

		this.workletNode.port.postMessage({ command: 'start' });
		this.workletNode.port.onmessage = event => this.publish({ timeDomain: event.data });

		this.isRecording = true;
	}

	public stop(): void {
		if (!this.isRecording) return;

		this.workletNode.port.postMessage({ command: 'stop' });
		this.micStream.getTracks().forEach(track => track.stop());
		this.isRecording = false;
	}
}
