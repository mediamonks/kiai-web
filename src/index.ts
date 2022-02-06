import AmplitudeGate from './lib/AmplitudeGate';
import AmplitudeMeter from './lib/AmplitudeMeter';
import AudioPlayer from './lib/AudioPlayer';
import ChunkBuffer from './lib/ChunkBuffer';
import Converter from './lib/Converter';
import NoteConverter from './lib/NoteConverter';
import Oscilloscope from './lib/Oscilloscope';
import PitchDetector from './lib/PitchDetector';
import Recorder from './lib/Recorder';
import RecorderV2 from './lib/RecorderV2';
import SignalEqualizer from './lib/SignalEqualizer';
import SignalSmoothener from './lib/SignalSmoothener';
import SignalTrigger from './lib/SignalTrigger';
import SpectrumAnalyser from './lib/SpectrumAnalyser';
import Transcriber from './lib/Transcriber';
import Vocalizer from './lib/Vocalizer';

export const Nodes = {
	AmplitudeGate,
	AmplitudeMeter,
	AudioPlayer,
	ChunkBuffer,
	Converter,
	NoteConverter,
	Oscilloscope,
	PitchDetector,
	Recorder,
	RecorderV2,
	SignalEqualizer,
	SignalSmoothener,
	SignalTrigger,
	SpectrumAnalyser,
	Transcriber,
	Vocalizer,
};

export { default as Voice } from './lib/Voice';
export { default as VoiceInput } from './lib/VoiceInput';
