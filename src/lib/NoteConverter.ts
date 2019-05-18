import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4 = 440;
const C0 = Math.round(A4 * Math.pow(2, -4.75)); // 16

const calculateSemiTone = (frequency: number) => 12 * Math.log2(frequency / C0);

const calculateOctave = (semiTone: number) => Math.floor(semiTone / 12);

const calculateCents = (currentFrequency: number, lastFrequency: number) =>
  1200 * Math.log2(lastFrequency / currentFrequency);

const calculateNote = (semiTone: number) => {
  const notePosition = Math.floor(semiTone % 12);
  return NOTES[notePosition];
};

export default class NoteConverter extends PipeSource implements IPipeDestination {
  private lastFrequency: number = 0;

  public receive({ frequency }: { frequency: number }): void {
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
