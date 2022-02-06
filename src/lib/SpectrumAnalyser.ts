/*
	Takes audio data and renders a spectrum analysis graph on a canvas
 */
import { IPipeDestination, TAudioData, TColor } from './types';
import Node from './Node';

type TSpectrumAnalyserOptions = {
	canvasElement?: HTMLCanvasElement;
	color?: TColor;
	thickness?: number;
	minDecibels?: number;
	maxDecibels?: number;
};

export default class SpectrumAnalyser extends Node implements IPipeDestination {
	private readonly canvasContext: CanvasRenderingContext2D;
	protected readonly defaultOptions: TSpectrumAnalyserOptions = {
		color: [191, 191, 191],
		thickness: 1,
		minDecibels: -140,
		maxDecibels: 0,
	};

	public constructor(options: TSpectrumAnalyserOptions) {
		super(options);

		const { canvasElement, color } = this.options as TSpectrumAnalyserOptions;

		if (!canvasElement) throw new Error('SpectrumAnalyser: canvasElement is required');

		this.canvasContext = canvasElement.getContext('2d');
		this.canvasContext.fillStyle = `rgba(${color.join(',')}, 1)`;
	}

	public receive({ frequency }: TAudioData): void {
		const { canvasElement, thickness, minDecibels, maxDecibels } = this.options as TSpectrumAnalyserOptions;
		const { canvasContext } = this;
		const canvasWidth = canvasElement.width;
		const canvasHeight = canvasElement.height;
		const { length } = frequency;
		const amp = maxDecibels - minDecibels;

		canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

		frequency.forEach((value, index) => {
			const posX = (index / length) * canvasWidth;
			const posY = ((value - minDecibels) / amp) * canvasHeight;

			canvasContext.fillRect(posX, canvasHeight - posY, thickness, posY);
		});
	}
}
