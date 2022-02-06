/*
	Converts a Float32Array audio chunk to an Int16Array (LINEAR16)
 */
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

const convert = (buffer: Float32Array): ArrayBuffer => {
	const bufferArray = new Int16Array(buffer.length);

	buffer.forEach((value: number, index: number) => {
		bufferArray[index] = Math.min(1, value) * 0x7FFF;
	});

	return bufferArray.buffer;
};

export default class Converter extends PipeSource implements IPipeDestination {
	public receive(buffer: Float32Array): void {
		this.publish(convert(buffer));
	}
}
