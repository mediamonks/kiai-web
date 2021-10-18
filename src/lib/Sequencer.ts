type TSequence = (() => Promise<void> | void)[];

export default class Sequencer {
	private sequences: {
		[key: string]: {
			steps: TSequence;
			currentIndex: number;
			resolver?: () => void;
			running: boolean;
			loop: boolean;
		};
	} = {};

	constructor(sequences?: { [key: string]: TSequence }) {
		if (!sequences) return;

		Object.keys(sequences).forEach(key => this.add(key, sequences[key]));
	}

	public add(name: string, sequence: TSequence) {
		if (this.sequences[name]) {
			throw new Error(`Sequencer: sequence with name ${name} already exists.`);
		}

		if (!sequence.length) {
			throw new Error(`Sequencer: sequence with name ${name} needs to have at least one step.`);
		}

		this.sequences[name] = {
			steps: sequence,
			currentIndex: 0,
			running: false,
			loop: false,
		};

		return this;
	}

	public play(name: string, loop: boolean = false): Promise<void> {
		const sequence = this.sequences[name];

		if (!sequence) return Promise.reject(new Error(`Sequencer: sequence with name ${name} doesn't exist.`));

		sequence.loop = loop;
		sequence.running = true;

		return new Promise(resolve => {
			sequence.resolver = resolve;
			this.next(name);
		});
	}

	private next(name: string): void {
		const sequence = this.sequences[name];

		if (!sequence.running) return sequence.resolver();

		if (sequence.currentIndex >= sequence.steps.length) {
			if (sequence.loop) sequence.currentIndex = 0;
			else return this.stop(name);
		}

		const next = sequence.steps[sequence.currentIndex];

		sequence.currentIndex++;

		Promise.resolve(next()).then(() => {
			setTimeout(() => this.next(name), 0);
		});
	}

	public stop(name: string): void {
		const sequence = this.sequences[name];

		if (!sequence) throw new Error(`Sequencer: sequence with name ${name} doesn't exist.`);

		if (!sequence.running) return;

		sequence.running = false;
		return this.sequences[name].resolver();
	}

	public stopAll(): void {
		Object.keys(this.sequences).forEach(name => this.stop(name));
	}
}
