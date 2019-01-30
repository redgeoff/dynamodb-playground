import React, { Component } from 'react';

class App extends Component {
  foo() {}

  render() {
    return (
      <div className="App">
        <button onClick={this.foo}>Foo</button>
      </div>
    );
  }
}

export default App;
