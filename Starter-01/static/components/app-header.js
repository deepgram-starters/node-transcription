import { css, html, LitElement } from "//cdn.skypack.dev/lit";
import "./app-button-link.js";
class AppHeader extends LitElement {
  static styles = css`
    h1 {
      font-size: inherit;
      font-weight: inherit;
      margin: 0;
    }

    nav {
      background: linear-gradient(
          3.95deg,
          #101014 3.44%,
          rgba(0, 0, 0, 0) 174.43%
        ),
        linear-gradient(
          270deg,
          #208f68 0.7%,
          #27336a 24.96%,
          #0c0310 50.78%,
          #370c4d 76.47%,
          #95125c 100%
        );
      color: white;
    }

    .nav-margin {
      height: 100px;
      max-width: 1536px;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: space-between;
      align-items: center;
      align-content: stretch;
      padding-left: 2rem;
      padding-right: 2rem;
    }

    .nav-logo {
      display: inline;
      height: 2rem;
      margin-bottom: -5px;
      margin-right: 1rem;
    }

    .nav-heading {
      display: inline;
    }

    .nav-brand {
      color: white;
      align-items: center;
      display: flex;
      height: 4rem;
    }
  `;

  render() {
    return html`<nav>
      <div class="nav-margin">
        <div class="nav-brand">
          <img src="assets/dg.svg" class="nav-logo" />
          <div>Starter Apps</div>
        </div>

        <app-button-link
          url="https://github.com/deepgram-starters"
          class="secondary"
        >
          <span style="margin-right:10px;">Get the code on Github</span>
        </app-button-link>
      </div>
    </nav>`;
  }
}

customElements.define("app-header", AppHeader);
