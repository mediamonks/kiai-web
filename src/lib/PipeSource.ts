// eslint-disable-next-line max-classes-per-file
import Node from './Node';
import { IPipeDestination } from './types';

type TPipeFunction = (data: unknown) => unknown;

export default abstract class PipeSource extends Node {
	private readonly destinations: Array<IPipeDestination> = [];

	public pipe(destination: IPipeDestination | TPipeFunction): PipeSource {
		// eslint-disable-next-line no-param-reassign,no-use-before-define,@typescript-eslint/no-use-before-define
		if (typeof destination === 'function') destination = new HandlerNode(destination);

		this.destinations.push(destination);

		return destination as PipeSource & IPipeDestination;
	}

	protected publish(data: unknown): void {
		this.destinations.forEach(destination => {
			setTimeout(() => destination.receive(data), 0);
		});
	}
}

class HandlerNode extends PipeSource implements IPipeDestination {
	private readonly handler: TPipeFunction;

	public constructor(handler: TPipeFunction) {
		super();

		this.handler = handler;
	}

	public receive(data: unknown): void {
		this.publish(this.handler(data));
	}
}
