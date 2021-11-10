import md5 from 'md5';
import Vocalizer from './Vocalizer';
import AudioPlayer from './AudioPlayer';

// @ts-ignore
window.AudioContext = window.AudioContext || window.webkitAudioContext;

export default class Voice {
	private audioPlayer: AudioPlayer;
	private vocalizer: Vocalizer = null;
	private cache: { [hash: string]: AudioBuffer | Promise<AudioBuffer> } = {};
	private audioContext: AudioContext;

	constructor(options: { [key: string]: any }) {
		this.audioContext = new AudioContext();

		this.vocalizer = new Vocalizer({ ...options, audioContext: this.audioContext });

		this.audioPlayer = new AudioPlayer({ audioContext: this.audioContext });

		this.unlockAudioContext();
	}

	public preload(
		phrases: string[],
		progressCallback: (progress: number) => void = () => null,
	): Promise<void[]> {
		let loaded = 0;

		const loadPhrase = (phrase: string) =>
			this.load(phrase)
				.then(() => {
					progressCallback(++loaded / phrases.length);
				})
				.catch(error => {
					progressCallback(++loaded / phrases.length);
					throw new Error(`[VOICE] failed to load ${phrase} error ${error}`);
				});

		return Promise.all(phrases.map(loadPhrase));
	}

	public async say(phrase: string): Promise<void> {
		await this.audioPlayer.stop().play(await this.load(phrase));
	}

	public load(phrase: string): Promise<AudioBuffer> {
		const hash = md5(phrase);
		const cache = this.cache[hash];
		// tslint:disable-next-line:no-console
		// if (cache instanceof AudioBuffer) console.debug('[Voice]', `from cache "${phrase}"`);
		// tslint:disable-next-line:no-console
		// if (cache instanceof Promise) console.debug('[Voice]', `already loading "${phrase}"`);
		if (!cache) {
			this.cache[hash] = this.vocalizer.synthesize(phrase).then(audio => {
				this.cache[hash] = audio;
				// tslint:disable-next-line:no-console
				// console.debug('[Voice]', `loaded "${phrase}"`);
				return audio;
			});
		}
		return this.cache[hash] as Promise<AudioBuffer>;
	}

	public shutUp(): Voice {
		this.audioPlayer.stop();
		return this;
	}

	public release(): Voice {
		// tslint:disable-next-line:no-console
		// console.debug('[VOICE] cache released');
		this.cache = {};
		return this;
	}

	private unlockAudioContext() {
		const { audioContext } = this;

		if (!audioContext || audioContext.state !== 'suspended') return;

		const { body } = document;
		const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];

		async function unlock() {
			await audioContext.resume();
			events.forEach(event => body.removeEventListener(event, unlock));
		}

		events.forEach(event => body.addEventListener(event, unlock, false));
	}
}
