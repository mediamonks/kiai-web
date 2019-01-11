import { IPipeDestination } from './types';

export abstract class PipeSource {
  private destinations: IPipeDestination[] = [];
  
  public pipe(destination: IPipeDestination): PipeSource {
    this.destinations.push(destination);
    return destination as PipeSource & IPipeDestination;
  }
  
  protected publish(data: any): void {
    this.destinations.forEach(destination => {
      destination.receive(data);
    });
  }
}
