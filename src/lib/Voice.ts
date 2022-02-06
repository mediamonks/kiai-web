/*
	Combines the Vocalizer and AudioPlayer to represent a single voice
	Takes text phrases and allows their playback as audio
 */
import md5 from 'md5';
import Vocalizer from './Vocalizer';
import AudioPlayer from './AudioPlayer';
import Context from './Context';

export default class Voice {
	private readonly audioPlayer: AudioPlayer;
	private readonly vocalizer: Vocalizer = null;
	private readonly audioContext: AudioContext;
	private cache: { [hash: string]: AudioBuffer | Promise<AudioBuffer> } = {};

	public constructor(options: { [key: string]: unknown }) {
		this.audioContext = Context.get();

		this.vocalizer = new Vocalizer({ ...options, audioContext: this.audioContext });

		this.audioPlayer = new AudioPlayer({ audioContext: this.audioContext });

		this.unlockAudioContext();
	}

	public preload(
		phrases: Array<string>,
		progressCallback: (progress: number) => void = () => null,
	): Promise<Array<void>> {
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
		if (!cache) {
			this.cache[hash] = this.vocalizer.synthesize(phrase).then(audio => {
				this.cache[hash] = audio;
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
