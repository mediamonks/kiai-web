import { IPipeDestination } from './types';
import EventEmitter from './EventEmitter';
import { Pipe } from './Pipe';

export default class PipeSource extends EventEmitter {
	private destinations: IPipeDestination[] = [];

	public pipe(destination: IPipeDestination | ((data: any) => any)): PipeSource {
		// eslint-disable-next-line no-param-reassign
		if (typeof destination === 'function') destination = new Pipe(destination);

		this.destinations.push(destination);

		return destination as PipeSource & IPipeDestination;
	}

	protected publish(data: any): void {
		this.destinations.forEach(destination => {
			setTimeout(() => destination.receive(data), 0);
		});
	}
}
