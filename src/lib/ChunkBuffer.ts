/*
	Takes audio data chunks and buffers them into an audio buffer, which is published when the buffer is flushed
 */
import { IPipeDestination, TAudioData } from './types';
import PipeSource from './PipeSource';

type TChunkBufferOptions = {
	audioContext?: AudioContext;
	sampleRate?: number;
};

export default class ChunkBuffer extends PipeSource implements IPipeDestination {
	private buffer: Array<Float32Array> = [];
	protected readonly defaultOptions: TChunkBufferOptions = {
		sampleRate: 44100,
	};

	public receive({ timeDomain }: TAudioData): void {
		this.buffer.push(timeDomain);
	}

	public clear(): void {
		this.buffer = [];
	}

	public flush(): void {
		if (!this.buffer.length) return;

		const { sampleRate } = this.options as TChunkBufferOptions;

		const size = this.buffer.reduce((result, chunk) => result + chunk.length, 0);
		const data = new Float32Array(size);
		let index = 0;
		this.buffer.forEach(chunk => {
			data.set(chunk, index);
			index += chunk.length;
		});
		this.clear();

		const audioBuffer = this.audioContext.createBuffer(1, size, sampleRate);
		audioBuffer.copyToChannel(data, 0);

		this.publish(audioBuffer);
	}
}
