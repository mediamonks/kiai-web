/*
	Takes a frequency value and publishes its musical notation
 */
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4 = 440;
// eslint-disable-next-line no-magic-numbers
const C0 = Math.round(A4 * (2 ** -4.75)); // 16
const NOTES_IN_OCTAVE = 12;
const CENTS_IN_NOTE = 100;

const calculateSemiTone = (frequency: number) => NOTES_IN_OCTAVE * Math.log2(frequency / C0);

const calculateOctave = (semiTone: number) => Math.floor(semiTone / NOTES_IN_OCTAVE);

const calculateCents = (currentFrequency: number, lastFrequency: number) =>
	CENTS_IN_NOTE * NOTES_IN_OCTAVE * Math.log2(lastFrequency / currentFrequency);

const calculateNote = (semiTone: number) => {
	const notePosition = Math.floor(semiTone % NOTES_IN_OCTAVE);
	return NOTES[notePosition];
};

export default class NoteConverter extends PipeSource implements IPipeDestination {
	private lastFrequency: number = 0;

	public receive(frequency: number): void {
		const semiTone = calculateSemiTone(frequency);

		const note = calculateNote(semiTone);

		const octave = calculateOctave(semiTone);

		let cents;
		if (this.lastFrequency) {
			cents = calculateCents(frequency, this.lastFrequency);
		}
		this.lastFrequency = frequency;

		this.publish({
			semiTone,
			note,
			octave,
			cents,
		});
	}
}
