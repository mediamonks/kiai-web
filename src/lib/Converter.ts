import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

const convert = (buffer: Float32Array): ArrayBuffer => {
	const bufferArray = new Int16Array(buffer.length);

	buffer.forEach(
		// eslint-disable-next-line no-magic-numbers,no-return-assign
		(value: number, index: number) => bufferArray[index] = Math.min(1, value) * 0x7fff,
	);

	return bufferArray.buffer;
};

export default class Converter extends PipeSource implements IPipeDestination {
	public receive(buffer: Float32Array) {
		this.publish(convert(buffer));
	}
}
