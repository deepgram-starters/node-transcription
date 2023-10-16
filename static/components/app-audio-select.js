import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";

class AppAudioSelect extends LitElement {
  static properties = {
    files: {},
    error: {},
    working: {},
    file: {},
    selectedExample: {},
    selectedFile: {},
  };

  static styles = css`
    .app-audio-select {
      width: 80rem;
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-columns: 40% 10% 40%;
      column-gap: 1rem;
      padding-inline-start: 0px;
      justify-items: center;
    }

    ul {
      list-style: none;
    }

    .audio-own {
      width: 80%;
      position: relative;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    .button-choose-file {
      border: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 0.0625rem;
      background: linear-gradient(95deg, #1796c1 20%, #15bdae 40%, #13ef95 95%);
      height: 45px;
      width: 250px;
      cursor: pointer;
    }

    .selected-file {
      color: rgb(239, 0, 116);
    }

    .audio-own-label {
      font-size: 20px;
      display: flex;
      flex-direction: column;
      padding-bottom: 1.25rem;
    }

    .audio-files-label {
      font-size: 20px;
    }

    .label-text {
      margin: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    .or-text {
      height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px;
      font-size: 14px;
      display: inline-block;
      position: relative;
      margin-top: 50px;
    }

    .or-text:before {
      content: "";
      width: 1px;
      height: 50px;
      background: #616165;
      position: absolute;
      bottom: 100%;
      left: 50%;
    }

    .or-text:after {
      content: "";
      width: 1px;
      height: 160px;
      background: #616165;
      position: absolute;
      bottom: -70%;
      left: 50%;
    }

    .audio-file {
      margin-bottom: 10px;
      border-radius: 0.0625rem;
      height: 51px;
      background: #2e3c4d;

      border: solid #3d4f66 1px;
      box-shadow: 0 20px 25px -5px black, 0 8px 10px -6px black;
    }

    .audio-file.active {
      background: #3d4f66;
    }

    .audio-file-label {
      font-size: 14px;
      min-height: 100%;
      display: flex;
      justify-content: center;
      flex-direction: column;
      border-radius: 0.5rem;
      cursor: pointer;
      padding-left: 16px;
      padding-right: 80px;
    }
  `;

  constructor() {
    super();
    this.working = false;
    this.selectedExample = "";
    this.selectedFile = {};
    this.file = {};
    this.files = [
      {
        key: "podcast",
        name: "PODCAST: Deep Learning’s Effect on Science",
        checked: true,
        value:
          "https://res.cloudinary.com/deepgram/video/upload/v1663090404/dg-audio/AI_Show_afpqeh.m4a",
      },
      {
        key: "phone",
        name: "PHONE CALL: First all female NASA Spacewalk",
        checked: false,
        value:
          "https://res.cloudinary.com/deepgram/video/upload/v1663090406/dg-audio/NASA-EXP61_EVA_n5zazi.m4a",
      },
      {
        key: "callcenter",
        name: "CALL CENTER: Upgrade Service",
        checked: false,
        value:
          "https://res.cloudinary.com/deepgram/video/upload/v1663090406/dg-audio/Upgrading-phone-plan_pmfsfm.m4a",
      },
    ];
  }

  get _fileInput() {
    return (this.___fileInput ??=
      this.renderRoot?.querySelector("#file") ?? null);
  }

  get _fileURL() {
    return (this.___fileURL ??=
      this.renderRoot?.querySelector(".audio-example") ?? null);
  }

  get _audioFile() {
    return (this.___audioFile ??=
      this.renderRoot?.querySelectorAll(".audio-file") ?? null);
  }

  handleChange(e) {
    this.selectedFile = {};
    this.selectedExample = e.target.value;
    this._dispatchSelectCdnAudio();
  }

  handleClick() {
    if (this._fileInput) {
      this._fileInput.value = null;
      this.selectedFile = null;
    }

    if (this._fileURL) {
      this._dispatchSelectCdnAudio();
      this._fileInput.value = null;
    }
  }

  showSelected(e) {
    this._audioFile.forEach((node) => {
      if (
        e.target.value &&
        e.target.value == node.childNodes[1].childNodes[1].value
      ) {
        node.className += " active";
      }
    });
    for (let i = 0; i < this._audioFile.length; i++) {
      this._audioFile[i].className = this._audioFile[i].className.replace(
        " active",
        ""
      );
    }
    this._audioFile.forEach((li) => {
      if (li.innerText == e.target.innerText) {
        li.className += " active";
        this.currentCategory = e.target.innerText;
        this.requestUpdate();
      }
    });
  }

  clearSelected() {
    for (let i = 0; i < this._audioFile.length; i++) {
      this._audioFile[i].className = this._audioFile[i].className.replace(
        " active",
        ""
      );
    }
  }

  chooseFile() {
    this._fileInput.click();
    this.clearSelected();
  }

  _dispatchSelectUploadFile() {
    this.selectedFile = this._fileInput.files[0];
    if (this.selectedFile) {
      const options = {
        detail: this.selectedFile,
        bubbles: true,
        composed: true,
      };
      this.dispatchEvent(new CustomEvent("fileselect", options));
    }
  }
  _dispatchSelectCdnAudio() {
    if (this.selectedExample) {
      const options = {
        detail: this.selectedExample,
        bubbles: true,
        composed: true,
      };
      this.dispatchEvent(new CustomEvent("fileURLselect", options));
    }
  }

  render() {
    return html`<ul class="app-audio-select">
      <li class="audio-own">
        <input
          class="sr-only peer"
          type="radio"
          name="audio"
          ?disabled="${this.working}"
        />
        <label class="audio-own-label" htmlFor="file">
          <p class="label-text">Use your own audio</p>
        </label>

        <input
          class="sr-only"
          id="file"
          type="file"
          name="file"
          accept="audio/*,video/*"
          ?disabled="${this.working}"
          @change="${this._dispatchSelectUploadFile}"
        />

        <input
          class="button-choose-file"
          type="button"
          @click="${this.chooseFile}"
          value="Upload Audio File"
        />
        <p style="max-width:450px; ">
          We accept over 40 common audio file formats including MP3, WAV, FLAC,
          M4A, and more.
        </p>
        <div class="selected-file">
          ${this.selectedFile ? this.selectedFile.name : null}
        </div>
      </li>
      <li class="or-text">OR</li>
      <ul>
        <label class="audio-files-label">
          <p class="label-text">Pick a sample file</p>
        </label>

        ${this.files.map(
          (item) =>
            html`<li
              key="${item.key}"
              class="audio-file"
              @click="${this.showSelected}"
            >
              <label class="audio-file-label" htmlFor="${item.key}">
                <input
                  class="sr-only peer audio-example"
                  type="radio"
                  name="audio"
                  value="${item.value}"
                  defaultChecked="${item.checked}"
                  id="${item.key}"
                  ?disabled="${this.working}"
                  @change="${this.handleChange}"
                  @click="${this.handleClick}"
                />
                ${item.name}
              </label>
            </li>`
        )}
      </ul>
    </ul>`;
  }
}

customElements.define("app-audio-select", AppAudioSelect);
