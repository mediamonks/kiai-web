type TEventHandler = (payload?: unknown) => void;

export default abstract class EventEmitter {
	private handlers: { [key: string]: Array<TEventHandler> } = {};

	public emit(eventName: string, ...args: Array<unknown>): void {
		if (!this.handlers[eventName]) return;
		this.handlers[eventName].forEach((handler: TEventHandler) =>
			window.setTimeout(() => handler(...args), 0),
		);
	}

	public on(eventName: string, handler: TEventHandler): EventEmitter {
		this.handlers[eventName] = this.handlers[eventName] || [];
		this.handlers[eventName].push(handler);
		return this;
	}
}
