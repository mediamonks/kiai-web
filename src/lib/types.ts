export type TIntentParameter = {
  name: string;
  entity: string;
  mandatory: boolean;
};

export type TIntent = {
  events: string[];
  isFallback: boolean;
  phrases: {
    [language: string]: string[];
  };
  parameters: TIntentParameter[];
  contexts: string[];
  priority: string;
};

export type TIntents = { [name: string]: TIntent };

export interface IPipeDestination {
  receive: (data: any) => void
}
