import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";
import "./app-demo.js";
import "./app-audio-select.js";
import "./app-model-select.js";
import "./app-feature-select.js";

class AppBody extends LitElement {
  static styles = css`
    .body {
      flex-grow: 1;
    }
  `;

  render() {
    return html`<article class="body">
      <app-demo>
        <app-audio-select></app-audio-select>
        <app-model-select></app-model-select>
        <app-feature-select></app-feature-select>
      </app-demo>
    </article>`;
  }
}

customElements.define("app-body", AppBody);
