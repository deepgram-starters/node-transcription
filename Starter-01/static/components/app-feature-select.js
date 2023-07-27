import { html, css, LitElement } from "//cdn.skypack.dev/lit";

class AppFeatureSelect extends LitElement {
  static properties = {
    features: {},
    displayedFeatures: {},
    selectedFeatures: {},
    currentCategory: {},
  };

  static styles = css`
    * {
      box-sizing: border-box;
    }

    .app-feature-select {
      display: flex;
      justify-content: center;
      border-radius: 0.0625rem;
    }

    .tab {
      float: left;
      width: 20%;
      height: 300px;
    }

    .tab button {
      width: 100%;
      color: #a9a9ad;
      text-align: left;
      margin-bottom: 10px;
      border-radius: 0.0625rem;
      height: 51px;
      background: #2e3c4d;
      border: solid #3d4f66 1px;
      border-right: none;
      box-shadow: 0 20px 25px -5px black, 0 8px 10px -6px black;
      font-weight: 900;
      padding: 0 10px;
    }

    .tab button.active {
      color: white;
    }

    .tab button.active div {
      border-bottom: 3px solid #ef0074;
      padding-bottom: 3px;
    }

    .tabcontent {
      background: #2e3c4d;
      float: left;
      padding: 1.25rem;
      border-radius: 0.0625rem;
      border-left: none;
      height: fit-content;
      min-height: 300px;
      width: 50%;
      border: solid #3d4f66 1px;
    }

    .tabcontent input {
      background-color: ;
    }

    .tabcontent label {
      font-weight: 600;
    }

    .tabcontent p {
      color: #ededf2;
    }
  `;

  constructor() {
    super();
    this.displayedFeatures = [];
    this.selectedFeatures = {};
    this.categories = [
      "FORMATTING",
      "REPLACEMENT",
      "IDENTIFICATION",
      "INFERENCE",
    ];
    this.currentCategory = "";
    this.features = [
      {
        category: "FORMATTING",
        name: "Smart Format",
        description:
          "Smart Format improves readability by applying additional FORMATTING. When enabled, the following features will be automatically applied: Punctuation, Numerals, Paragraphs, Dates, Times, and Alphanumerics.",
        key: "smart_format",
        dataType: "boolean",
      },
      {
        category: "FORMATTING",
        name: "Punctuation",
        description:
          "Indicates whether to add punctuation and capitalization to the transcript.",
        key: "punctuate",
        dataType: "boolean",
      },
      {
        category: "FORMATTING",
        name: "Paragraphs",
        description:
          "Indicates whether Deepgram will split audio into paragraphs to improve transcript readability. When paragraphs is set to true, punctuate will also be set to true.",
        key: "paragraphs",
        dataType: "boolean",
      },
      {
        category: "FORMATTING",
        name: "Utterances",
        description:
          "Segments speech into meaningful semantic units. By default, when utterances is enabled, it starts a new utterance after 0.8 s of silence. You can customize the length of time used to determine where to split utterances by submitting the utt_split keyeter.",
        key: "utterances",
        dataType: "boolean",
      },
      {
        category: "REPLACEMENT",
        name: "Numerals",
        description:
          "Indicates whether to convert numbers from written format (e.g. one) to numerical format (e.g. 1).",
        key: "numerals",
        dataType: "boolean",
      },
      {
        category: "REPLACEMENT",
        name: "Profanity Filter",
        description:
          "Indicates whether to remove profanity from the transcript.",
        key: "profanity_filter",
        dataType: "boolean",
      },
      // {
      //   category: "REPLACEMENT",
      //   name: "Redaction",
      //   description:
      //     "Indicates whether to redact sensitive information, replacing redacted content with asterisks (*).",
      //   key: "redact",
      //   dataType: "string",
      // },
      // {
      //   category: "REPLACEMENT",
      //   name: "Find and Replace",
      //   description:
      //     "Terms or phrases to search for in the submitted audio and replace.",
      //   key: "replace",
      //   dataType: "string",
      // },
      // {
      //   category: "IDENTIFICATION",
      //   name: "Search",
      //   description:
      //     "Terms or phrases to search for in the submitted audio. Deepgram searches for acoustic patterns in audio rather than text patterns in transcripts because we have noticed that acoustic pattern matching is more performant.",
      //   key: "search",
      //   dataType: "string",
      // },
      // {
      //   category: "IDENTIFICATION",
      //   name: "Keywords",
      //   description:
      //     "Keywords to which the model should pay particular attention to boosting or suppressing to help it understand context. Intensifier indicates how much you want to boost it. The default Intensifier is one (1). An Intensifier of two (2) equates to two boosts multiplied in a row, whereas zero (0) is equivalent to not specifying a keywords keyeter at all.",
      //   key: "keywords",
      //   dataType: "string",
      // },
      // {
      //   category: "IDENTIFICATION",
      //   name: "Language Detection",
      //   description: "Indicates whether to identify which language is spoken.",
      //   key: "detect_language",
      //   dataType: "boolean",
      // },
      {
        category: "IDENTIFICATION",
        name: "Diarization",
        description: "Indicates whether to recognize speaker changes.",
        key: "diarize",
        dataType: "boolean",
      },
      {
        category: "INFERENCE",
        name: "Summarization",
        description:
          "Indicates whether Deepgram will provide summaries for sections of content. When Summarization is enabled, Punctuation will also be enabled by default.",
        key: "summarize",
        dataType: "boolean",
      },
      {
        category: "INFERENCE",
        name: "Topic Detection",
        description:
          "Indicates whether Deepgram will identify and extract key topics for sections of content.",
        key: "detect_topics",
        dataType: "boolean",
      },
      // {
      //   category: "INFERENCE",
      //   name: "Entity Detection (beta)",
      //   description:
      //     "Indicates whether Deepgram will identify and extract key entities for sections of content.",
      //   key: "detect_entities",
      //   dataType: "boolean",
      // },
    ];
  }

  get _tablinks() {
    return (this.___tablinks ??=
      this.renderRoot?.querySelectorAll(".tablinks") ?? null);
  }

  get _tabcontent() {
    return (this.___tabcontent ??=
      this.renderRoot?.querySelectorAll(".tabcontent") ?? null);
  }

  get _button() {
    return (this.___button ??=
      this.renderRoot?.querySelectorAll("button") ?? null);
  }

  firstUpdated() {
    for (let i = 1; i < this._tabcontent.length; i++) {
      this._tabcontent[i].style.display = "none";
    }
  }

  openSection(e) {
    const tabcontent = this._tabcontent;
    const tablinks = this._tablinks;

    for (let i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
      if (tabcontent[i].id === e.target.innerText) {
        tabcontent[i].style.display = "block";
      }
    }

    for (let i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    this._button.forEach((button) => {
      if (button.innerText == e.target.innerText) {
        button.className += " active";
        this.currentCategory = e.target.innerText;
        this.requestUpdate();
      }
    });
  }

  filterFeatures(item) {
    this.displayedFeatures = [];
    this.features.filter((i) => {
      if (i.category === item) {
        this.displayedFeatures.push(i);
      }
    });
  }

  selectFeature(e) {
    if (this.selectedFeatures.hasOwnProperty(e.target.name)) {
      const featureToDelete = e.target.name;
      delete this.selectedFeatures[featureToDelete];
    } else {
      this.selectedFeatures[e.target.name] = true;
    }

    if (this.selectedFeatures.hasOwnProperty("diarize")) {
      if (!this.selectedFeatures.hasOwnProperty("utterances")) {
        // if diarize is turned on, utterances needs to be turned on for the formatter to work
        this.selectedFeatures["utterances"] = true;
      }
    }

    const options = {
      detail: this.selectedFeatures,
      bubbles: true,
      composed: true,
    };

    this.dispatchEvent(new CustomEvent("featureselect", options));
  }

  render() {
    return html`<div class="app-feature-select">
      <div class="tab">
        <button class="tablinks active" @click="${this.openSection}">
          <div>FORMATTING</div>
        </button>
        <button class="tablinks" @click="${this.openSection}">
          <div>REPLACEMENT</div>
        </button>
        <button class="tablinks" @click="${this.openSection}">
          <div>IDENTIFICATION</div>
        </button>
        <button class="tablinks" @click="${this.openSection}">
          <div>INFERENCE</div>
        </button>
      </div>

      <div id="FORMATTING" class="tabcontent">
        <section @load=${this.filterFeatures("FORMATTING")}>
          ${this.displayedFeatures.map(
            (feature) =>
              html`
                  <input type="checkbox" id="${feature.key}" name="${feature.key}" @change="${this.selectFeature}"><label for="${feature.key}">${feature.name}</label><p>${feature.description}</p></div>`
          )}
        </section>
      </div>

      <div id="REPLACEMENT" class="tabcontent">
        <section @load=${this.filterFeatures("REPLACEMENT")}>
          ${this.displayedFeatures.map(
            (feature) =>
              html`
                  <input type="checkbox" id="${feature.key}" name="${feature.key}" @change="${this.selectFeature}"><label for="${feature.key}">${feature.name}</label><p>${feature.description}</p></div>`
          )}
        </section>
      </div>

      <div id="IDENTIFICATION" class="tabcontent">
        <section @load=${this.filterFeatures("IDENTIFICATION")}>
          ${this.displayedFeatures.map(
            (feature) =>
              html`
                  <input type="checkbox" id="${feature.key}" name="${feature.key}" @change="${this.selectFeature}"><label for="${feature.key}">${feature.name}</label><p>${feature.description}</p></div>`
          )}
        </section>
      </div>

      <div id="INFERENCE" class="tabcontent">
        <section @load=${this.filterFeatures("INFERENCE")}>
          ${this.displayedFeatures.map(
            (feature) =>
              html`
                <input
                  type="checkbox"
                  id="${feature.key}"
                  name="${feature.key}"
                  @change="${this.selectFeature}"
                />
                <label for="${feature.key}">${feature.name}</label>
                <p>${feature.description}</p>
              `
          )}
        </section>
      </div>
    </div>`;
  }
}

customElements.define("app-feature-select", AppFeatureSelect);
