import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";

class AppModelSelect extends LitElement {
  static properties = {
    models: {},
    selectedModel: {},
  };
  static styles = css`
    .app-model-select {
      margin-top: 5rem;
      width: 80rem;
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-columns: 35% 20% 10%;
      column-gap: 1rem;
      padding-inline-start: 0px;
    }

    .select-container {
      display: flex;
      flex-direction: column;
      grid-column: 2;
    }

    select {
      padding: 0 16px;
      width: 100%;
      font-size: 14px;
      box-shadow: 0 20px 25px -5px black, 0 8px 10px -6px black;
      color: white;
      height: 51px;
      margin-bottom: 5rem;
      border-radius: 0.0625rem;
      background: #2e3c4d;
      border: solid #3d4f66 1px;
      -moz-appearance: none;
      -webkit-appearance: none;
      appearance: none;
      background-image: url("assets/select.svg");
      background-repeat: no-repeat, repeat;
      background-position: right 0.7em top 50%, 0 0;
      background-size: 14px auto, 150%;
    }

    label {
      margin-bottom: 0.75rem;
    }
  `;

  constructor() {
    super();
    this.selectedModel = "";
    this.models = [
      {
        model: "general",
        name: "Deepgram Nova",
        tier: "nova",
      },
      {
        model: "whisper",
        version: "medium",
        name: "Whisper Cloud",
      },
    ];
  }

  get _select() {
    return (this.___select ??=
      this.renderRoot?.querySelector("select") ?? null);
  }

  firstUpdated() {
    this.renderRoot.querySelector("select").selectedIndex = 0;
    this._dispatchSelectModel();
  }

  _dispatchSelectModel() {
    this.selectedModel = this._select.value;

    const model = this.models.filter((model) => {
      return model.name === this.selectedModel;
    });

    if (this.selectedModel) {
      const options = {
        detail: model,
        bubbles: true,
        composed: true,
      };
      this.dispatchEvent(new CustomEvent("modelselect", options));
    }
  }

  render() {
    return html`<div class="app-model-select">
      <div class="select-container">
        <label>Model:</label>
        <div class="styled-select">
          <select @change=${this._dispatchSelectModel}>
            ${this.models.map(
              (model) =>
                html`<option data-model="${model}">${model.name}</option>`
            )}
          </select>
        </div>
      </div>
    </div>`;
  }
}

customElements.define("app-model-select", AppModelSelect);
