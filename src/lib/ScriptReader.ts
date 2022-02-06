/*
	Needs work
 */
import PipeSource from './PipeSource';
import { IPipeDestination } from './types';

type TDialog = {
	global?: Array<{
		matches: Array<string>;
		play?: string;
		next?: string;
	}>;
	nodes: {
		[key: string]: {
			play: Array<string>;
			input?: {
				[key: string]: {
					matches: Array<string>;
					suggestion: string;
				};
			};
			fallback: Array<string>;
			next: string;
			revert: boolean;
		};
	};
};

type TScriptReaderOptions = {
	dialog?: TDialog;
	startNode?: string;
	audioDelay?: number;
};

const findMatch = (candidates: Array<string>, transcript: string): string | undefined =>
	candidates.find(candidate => {
		const regex = new RegExp(`(^|[^a-z])${candidate}([^a-z]|$)`, 'gimu');
		return regex.test(transcript);
	});

export default class ScriptReader extends PipeSource implements IPipeDestination {
	private readonly dialog: TDialog;
	private currentNode: string;
	private currentAudioIndex: number = 0;
	private fallbackCount: number = 0;
	private returnToNode: string;
	protected readonly defaultOptions: TScriptReaderOptions = {
		dialog: { nodes: {} },
		startNode: 'start',
		audioDelay: 1000,
	};

	public constructor(options: TScriptReaderOptions) {
		super(options);

		const { dialog, startNode } = this.options as TScriptReaderOptions;

		this.dialog = dialog;
		this.currentNode = startNode;
	}

	private get dialogNode() {
		return this.dialog.nodes[this.currentNode];
	}

	private setCurrentNode(node: string) {
		this.currentNode = node;
		this.currentAudioIndex = 0;
		this.fallbackCount = 0;
		this.emit('node', node);
		this.next();
	}

	private findMatchingKey(transcript: string): string | undefined {
		const { input } = this.dialogNode;
		return Object.keys(input).find(key => {
			const { matches } = input[key];
			return findMatch(matches, transcript);
		});
	}

	private findMatchingGlobalNode(transcript: string): string | undefined {
		if (!this.dialog.global) return undefined;

		return this.dialog.global.find(node => {
			const { matches } = node;
			return findMatch(matches, transcript);
		})?.play;
	}

	public receive(transcript: string): void {
		const matchingKey = this.findMatchingKey(transcript);

		if (matchingKey) {
			this.emit('match', { node: this.currentNode, key: matchingKey });
			this.setCurrentNode(matchingKey);
			return;
		}

		const audioName = this.findMatchingGlobalNode(transcript);

		if (audioName) {
			this.publish(audioName);
			return;
		}

		this.publish(this.dialogNode.fallback[this.fallbackCount]);
		this.fallbackCount++;

		this.emit('fallback', { node: this.currentNode, count: this.fallbackCount });
	}

	public revertFrom(node: string): void {
		this.returnToNode = this.currentNode;
		this.setCurrentNode(node);
		this.next();
	}

	public start(): void {
		this.next();
	}

	// eslint-disable-next-line max-statements
	public next(): void {
		const { audioDelay } = this.options as TScriptReaderOptions;
		const { play } = this.dialogNode;
		const audioName = play[this.currentAudioIndex];

		if (audioName) {
			setTimeout(() => this.publish(audioName), audioDelay);
			this.currentAudioIndex++;
			return;
		}

		if (this.dialogNode.input && this.fallbackCount < this.dialogNode.fallback.length) {
			this.emit('input', this.dialogNode.input || {});
			return;
		}

		const { next, revert } = this.dialogNode;
		if (revert && this.returnToNode) {
			this.setCurrentNode(this.returnToNode);
			this.returnToNode = '';
			return;
		}

		if (!next) {
			this.emit('ended');
			return;
		}

		if (this.fallbackCount && this.fallbackCount === this.dialogNode.fallback.length) {
			this.emit('fallthrough', this.currentNode);
		}

		this.setCurrentNode(next);
	}
}
