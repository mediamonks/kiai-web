/*
	Takes audio data and renders a waveform oscilloscope on a canvas
 */
import { IPipeDestination, TAudioData } from './types';

type TColor = [number, number, number];

type TOscilloscopeOptions = {
	canvasElement?: HTMLCanvasElement;
	color?: TColor;
	thickness?: number;
};

const DEFAULT_OPTIONS: TOscilloscopeOptions = {
	color: [191, 191, 191],
	thickness: 1,
};

export default class Oscilloscope implements IPipeDestination {
	private readonly canvasElement: HTMLCanvasElement;
	private readonly canvasContext: CanvasRenderingContext2D;
	private readonly options: TOscilloscopeOptions;

	public constructor(options: TOscilloscopeOptions) {
		if (!options.canvasElement) throw new Error('SpectrumAnalyser: canvasElement is required');

		this.options = { ...DEFAULT_OPTIONS, ...options };

		this.canvasElement = options.canvasElement;
		this.canvasContext = this.canvasElement.getContext('2d');
	}

	public receive({ timeDomain }: TAudioData): void {
		const canvasWidth = this.canvasElement.width;
		const canvasHeight = this.canvasElement.height;
		const bufferLength = timeDomain.length;
		const { color, thickness } = this.options;

		this.canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

		timeDomain.forEach((value, index) => {
			const posX = (index / bufferLength) * canvasWidth;
			const posY = (1 - (value + 1) / 2) * canvasHeight;

			const xMiddle = canvasWidth / 2;
			const opacity = 1 - Math.abs(posX - xMiddle) / xMiddle;
			this.canvasContext.fillStyle = `rgba(${color.join(',')}, ${opacity})`;

			this.canvasContext.fillRect(posX, posY - (thickness - 1) / 2, 1, thickness);
		});
	}
}
