import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import VoiceInput from '../node_modules/kiai-web/dist/lib/VoiceInput';

const PROJECT_ID = 'thuum-5fd63';

let voiceInput: VoiceInput;

class App extends Component {
  state = {
    result: null,
    kiaiInitialized: false,
  };

  initKiai() {
    voiceInput = new VoiceInput({
      host: 'localhost',
      port: 8080,
      projectId: PROJECT_ID,
      sampleRate: 16000,
      languageCode: 'en-US',
    });
    this.setState({ kiaiInitialized: true });
  }

  async listen() {
    const result = await voiceInput.listen();

    this.setState({ result });
  }

  render() {
    const { result, kiaiInitialized } = this.state;

    if (!kiaiInitialized) return <button onClick={() => this.initKiai()}>Init Kiai</button>;

    return (
      <Fragment>
        <button onClick={() => this.listen()}>Listen</button>;
        {result && <div>{JSON.stringify(result, null, 2)}</div>}
      </Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
