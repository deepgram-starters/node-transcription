import { html, css, LitElement } from "//cdn.skypack.dev/lit";

class AppButtonLink extends LitElement {
  static properties = {
    url: {},
    size: {},
  };
  static styles = css`
    a {
      color: inherit;
      text-decoration: none;
    }

    :host {
      background: #81f4b4;
      border-radius: 0.375rem;
      display: inline-flex;
      justify-content: center;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      padding-left: 0.75rem;
      padding-right: 0.75rem;
    }

    :host(:hover) {
      background: #00a93d;
      color: white;
    }

    :host(.large) {
      padding-left: 0.875rem;
      padding-right: 0.875rem;
      padding-top: 0.625rem;
      padding-bottom: 0.625rem;
    }

    :host(.secondary) {
      background: transparent;
      border: 1px solid #00e062;
      color: inherit;
    }

    .appbutton-link-content {
      color: inherit;
      display: flex;
      align-items: center;
    }
  `;

  render() {
    return html` <a
      href="${this.url}"
      class=${this.size === "large" ? "appbutton-link-large" : "appbutton-link"}
    >
      <div class="appbutton-link-content"><slot /></div>
    </a>`;
  }
}

customElements.define("app-button-link", AppButtonLink);
