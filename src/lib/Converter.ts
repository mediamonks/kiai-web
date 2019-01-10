import { PipeSource } from './PipeSource';
import { IPipeDestination } from './IPipeDestination';

export class Converter extends PipeSource implements IPipeDestination {
  public receive(buffer: Float32Array) {
    this.publish(this.convert(buffer));
  }
  
  private convert(buffer: Float32Array): ArrayBuffer {
    const bufferArray = new Int16Array(buffer.length);
  
    buffer.forEach((value: number, index: number) => {
      bufferArray[index] = Math.min(1, value) * 0x7fff;
    });
  
    return bufferArray.buffer;
  }
}
