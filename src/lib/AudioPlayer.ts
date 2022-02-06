/*
	Takes an audio buffer and plays it back
 */
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

type TAudioPlayerOptions = {
	audioContext?: AudioContext;
	queueInput?: boolean;
	queueTimeout?: number;
	publishInterval?: number;
};

export default class AudioPlayer extends PipeSource implements IPipeDestination {
	private readonly queue: Array<AudioBuffer> = [];
	private analyser: AnalyserNode;
	private playing: boolean = false;
	private publishTimer: number;
	private bufferSource: AudioBufferSourceNode;
	private paused: boolean = false;
	protected readonly defaultOptions: TAudioPlayerOptions = {
		queueInput: false,
		queueTimeout: 0,
		publishInterval: 100,
	};

	public receive(data: AudioBuffer): void {
		if (!this.options.queueInput) {
			this.play(data);
			return;
		}

		if (this.playing || this.paused) {
			this.queue.push(data);
			return;
		}

		this.play(data);
	}

	private next(): AudioPlayer {
		const { queueInput, queueTimeout } = this.options as TAudioPlayerOptions;

		if (!this.playing || this.paused) return this;

		if (!queueInput || !this.queue.length) {
			this.playing = false;
			this.bufferSource = null;
			this.emit('ended');
			return this;
		}

		setTimeout(() => this.playAudio(this.queue.shift()), queueTimeout);

		return this;
	}

	public play(data: AudioBuffer): Promise<void> {
		this.playing = true;
		this.emit('started');
		return this.playAudio(data);
	}

	private createBufferSource(): AudioBufferSourceNode {
		const gainNode = this.audioContext.createGain();
		gainNode.gain.value = 1;
		gainNode.connect(this.audioContext.destination);

		this.analyser = this.audioContext.createAnalyser();
		this.analyser.fftSize = 2048;
		this.analyser.connect(this.audioContext.destination);

		const source = this.audioContext.createBufferSource();
		source.connect(gainNode);
		source.connect(this.analyser);

		return source;
	}

	private playAudio(data: AudioBuffer): Promise<void> {
		const source = this.createBufferSource();

		source.buffer = data;

		this.bufferSource = source;

		return new Promise(resolve => {
			source.addEventListener('ended', () => {
				this.next();
				resolve();
			});

			source.start(0);

			this.publishTimeDomainData();
		});
	}

	public stop(): AudioPlayer {
		if (this.bufferSource) this.bufferSource.stop();
		this.playing = false;
		this.bufferSource = null;
		return this;
	}

	public pause(): AudioPlayer {
		this.paused = true;
		return this;
	}

	public resume(): AudioPlayer {
		this.paused = false;
		this.playing = true;
		this.next();
		return this;
	}

	private publishTimeDomainData(): void {
		if (!this.playing) return;

		this.publish(this.getFloatTimeDomainData());

		window.clearTimeout(this.publishTimer);
		this.publishTimer = window.setTimeout(
			this.publishTimeDomainData.bind(this),
			this.options.publishInterval as number,
		);
	}

	private getFloatTimeDomainData(): Float32Array {
		let array;

		if (this.analyser.getFloatTimeDomainData) {
			array = new Float32Array(this.analyser.fftSize);
			this.analyser.getFloatTimeDomainData(array);
			return array;
		}

		array = new Uint8Array(this.analyser.fftSize);
		this.analyser.getByteTimeDomainData(array);
		return Float32Array.from(array);
	}
}
