export default class Context {
	private static audioContext: AudioContext;

	public static get(): AudioContext {
		if (!Context.audioContext) Context.audioContext = new AudioContext();

		return this.audioContext;
	}
}
