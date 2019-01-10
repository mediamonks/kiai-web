import { PipeSource } from './PipeSource';
import { IPipeDestination } from './IPipeDestination';

export default class Matcher extends PipeSource implements IPipeDestination {
  private intents: any; // TODO: TIntents
  
  constructor (intents: any) { // TODO: TIntents
    super();
    
    this.intents = intents;
  }
  
  public receive (data: any) {
    if (data.intent) {
      this.publish(data.intent);
      return;
    }
    // TODO: Implement matching of partial matches against this.intents and publish if found
  };
};
