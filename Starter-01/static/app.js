import { html, LitElement } from "//cdn.skypack.dev/lit";

import "./components/app-header.js";
import "./components/app-body.js";

class App extends LitElement {
  render() {
    return html`
      <app-header></app-header>
      <app-body></app-body>
    `;
  }
}

customElements.define("deepgram-starter-ui", App);
