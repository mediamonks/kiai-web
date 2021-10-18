import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

export class Pipe extends PipeSource implements IPipeDestination {
	private readonly handler: (data: any) => any;

	constructor(handler: (data: any) => any) {
		super();

		this.handler = handler;
	}

	public receive(data: any): void {
		this.publish(this.handler(data));
	}
}
