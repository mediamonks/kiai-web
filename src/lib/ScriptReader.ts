import PipeSource from './PipeSource';
import { IPipeDestination } from './types';

type TDialog = {
	global?: {
		matches: string[];
		play?: string;
		next?: string;
	}[];
	nodes: {
		[key: string]: {
			play: string[];
			input?: {
				[key: string]: {
					matches: string[];
					suggestion: string;
				};
			};
			fallback: string[];
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

const DEFAULT_OPTIONS: TScriptReaderOptions = {
	dialog: { nodes: {} },
	startNode: 'start',
	audioDelay: 1000,
};

const findMatch = (candidates: string[], transcript: string): string | undefined =>
	candidates.find(cadidate => {
		const regex = new RegExp(`(^|[^a-z])${cadidate}([^a-z]|$)`, 'gimu');
		return regex.test(transcript);
	});

export default class ScriptReader extends PipeSource implements IPipeDestination {
	private readonly dialog: TDialog;
	private currentNode: string;
	private currentAudioIndex: number = 0;
	private fallbackCount: number = 0;
	private options: TScriptReaderOptions = {};
	private returnToNode: string;

	constructor(options: TScriptReaderOptions) {
		super();

		this.options = { ...DEFAULT_OPTIONS, ...options };

		this.dialog = this.options.dialog;
		this.currentNode = this.options.startNode;
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

	public revertFrom(node: string) {
		this.returnToNode = this.currentNode;
		this.setCurrentNode(node);
		this.next();
	}

	public start() {
		this.next();
	}

	// eslint-disable-next-line max-statements
	public next(): void {
		const { play } = this.dialogNode;
		const audioName = play[this.currentAudioIndex];

		if (audioName) {
			setTimeout(() => this.publish(audioName), this.options.audioDelay);
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
