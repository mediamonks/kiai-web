// eslint-disable-next-line max-classes-per-file
import { IPipeDestination } from './types';
import EventEmitter from './EventEmitter';

export default class PipeSource extends EventEmitter {
	private destinations: IPipeDestination[] = [];

	public pipe(destination: IPipeDestination | ((data: any) => any)): PipeSource {
		// eslint-disable-next-line no-param-reassign,no-use-before-define
		if (typeof destination === 'function') destination = new Pipe(destination);

		this.destinations.push(destination);

		return destination as PipeSource & IPipeDestination;
	}

	protected publish(data: any): void {
		console.debug('publish', data);
		this.destinations.forEach((destination) => {
			setTimeout(() => destination.receive(data), 0);
		});
	}
}

class Pipe extends PipeSource implements IPipeDestination {
	private readonly handler: (data: any) => any;

	constructor(handler: (data: any) => any) {
		super();

		this.handler = handler;
	}

	public receive(data: any): void {
		this.publish(this.handler(data));
	}
}
