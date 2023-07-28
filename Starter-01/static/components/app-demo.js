import { html, css, LitElement } from "//cdn.skypack.dev/lit";
import "./app-transcript.js";
import "./app-spinner.js";

class AppDemo extends LitElement {
  static properties = {
    error: {},
    done: {},
    working: {},
    selectedModel: {},
    file: {},
    fileUrl: {},
    selectedFeatures: {},
  };

  static styles = css`
    .app-demo {
      display: flex;
      flex-direction: column;
      margin-left: auto;
      margin-right: auto;
      max-width: 80rem;
      padding: 2rem;
    }

    .demo-instructions {
      font-size: 1.5rem;
      line-height: 2rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .submit-button {
      margin-top: 3rem;
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .submit-button button {
      border: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 0.0625rem;
      background: linear-gradient(95deg, #1796c1 20%, #15bdae 40%, #13ef95 95%);
      height: 45px;
      width: 250px;
      cursor: pointer;
    }

    .transcript {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  `;

  constructor() {
    super();
    this.selectedModel = "";
    this.file = {};
    this.fileUrl = "";
    this.selectedFeatures = {};
    this.error = "";
    this.done = true;
    this.working = false;
    this.result = {};
  }

  async submitRequest() {
    this.done = false;
    this.working = true;
    this.requestUpdate();
    const apiOrigin = "http://localhost:8080";
    const formData = new FormData();
    if (this.file.size > 0) {
      formData.append("file", this.file);
    }

    if (this.fileUrl) {
      formData.append("url", this.fileUrl);
    }

    formData.append("model", this.selectedModel.model);
    formData.append("tier", this.selectedModel.tier);
    formData.append("features", JSON.stringify(this.selectedFeatures));
    console.log("submit request");

    try {
      const response = await fetch(`${apiOrigin}/api`, {
        method: "POST",
        body: formData,
      });

      const { err, transcription } = await response.json();
      if (err) throw Error(err);
      const { results } = transcription;
      this.result = results;
      this.requestUpdate();
      this.done = true;
      this.working = false;
      setTimeout(() => {
        window.scrollTo({
          top: this._button[0].getBoundingClientRect().top,
          behavior: "smooth",
        });
      }, 500);
    } catch (error) {
      console.log(error);
      // this.error = error;
      this.working = false;
    }
  }

  isLoading() {
    if (this.working) {
      return html` <app-spinner></app-spinner>`;
    } else {
      return null;
    }
  }

  get _button() {
    return (this.___button ??=
      this.renderRoot?.querySelectorAll("button") ?? null);
  }

  _modelSelectListener(e) {
    this.selectedModel = e.detail[0];
  }

  _fileSelectListener(e) {
    this.file = e.detail;
    this.fileUrl = "";
    this.requestUpdate();
  }
  _fileURLSelectListener(e) {
    this.fileUrl = e.detail;
    this.file = {};
    this.requestUpdate();
  }
  _featureSelectListener(e) {
    this.selectedFeatures = e.detail;
    this.requestUpdate();
  }

  render() {
    return html`
      <div
        @fileselect=${this._fileSelectListener}
        @modelselect=${this._modelSelectListener}
        @fileURLselect=${this._fileURLSelectListener}
        @featureselect=${this._featureSelectListener}
        class="app-demo"
      >
        <slot></slot>
      </div>
      <div class="submit-button">
        <button @click="${this.submitRequest}">Transcribe</button>
        <p>${this.error}</p>
      </div>
      <div class="transcript">
        ${this.isLoading()}
        <app-transcript .result="${this.result}"> </app-transcript>
      </div>
    `;
  }
}

customElements.define("app-demo", AppDemo);
