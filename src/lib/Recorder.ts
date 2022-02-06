/*
	Records audio data from the microphone and publishes it, including frequency data if specified
	Uses deprecated script processor node
 */
import PipeSource from './PipeSource';

type TRecorderOptions = {
	bufferSize?: number;
	sampleRate?: number;
	channelCount?: number;
	publishFrequencyData?: boolean;
};

export default class Recorder extends PipeSource {
	private isRecording: boolean = false;
	private audioAnalyser: AnalyserNode;
	private stream: MediaStreamAudioSourceNode;
	private scriptProcessor: ScriptProcessorNode;
	protected readonly defaultOptions: TRecorderOptions = {
		bufferSize: 1024,
		sampleRate: 44100,
		channelCount: 1,
	};

	public async start(): Promise<void> {
		const { bufferSize, channelCount, sampleRate, publishFrequencyData } = this.options as TRecorderOptions;

		if (!this.scriptProcessor) {
			this.scriptProcessor = this.audioContext.createScriptProcessor(
				bufferSize,
				channelCount,
				channelCount,
			);

			this.scriptProcessor.onaudioprocess = event => {
				if (!this.isRecording) return;

				const timeDomain = event.inputBuffer.getChannelData(0).slice();

				if (publishFrequencyData) {
					const frequency = new Float32Array(this.audioAnalyser.frequencyBinCount);
					this.audioAnalyser.getFloatFrequencyData(frequency);

					this.publish({ timeDomain, frequency });

					return;
				}

				this.publish({ timeDomain });
			};

			this.scriptProcessor.connect(this.audioContext.destination);
		}

		if (publishFrequencyData && !this.audioAnalyser) {
			this.audioAnalyser = this.audioContext.createAnalyser();
			this.audioAnalyser.fftSize = bufferSize * 2;
		}

		if (!this.stream) {
			const micStream = await navigator.mediaDevices.getUserMedia({
				video: false,
				audio: { sampleRate, channelCount },
			});
			this.stream = this.audioContext.createMediaStreamSource(micStream);
			this.stream.connect(this.scriptProcessor);
			if (publishFrequencyData) this.stream.connect(this.audioAnalyser);
		}

		this.isRecording = true;
	}

	public stop(): void {
		this.isRecording = false;
	}
}
