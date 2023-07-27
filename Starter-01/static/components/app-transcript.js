import { html, css, LitElement } from "//cdn.skypack.dev/lit";

class AppTranscript extends LitElement {
  static properties = {
    result: {},
    transcript: {},
    summary: {},
    topics: {},
    diarize: {},
  };
  static styles = css`
    section {
      background: #2e3c4d;
      height: fit-content;
      width: 896px;
      margin-bottom: 10px;
      padding: 1.25rem;
      border-radius: 0.0625rem;
      border: solid #3d4f66 1px;
    }

    topics-section {
      display: flex;
      padding-right: 6px;
    }

    .diarize-section {
      padding-bottom: 6px;
    }
  `;
  constructor() {
    super();
    this.transcript = "";
    this.summary = "";
    this.topics = [];
    this.diarize = "";
  }

  update(changedProps) {
    if (changedProps.has("result")) {
      this.setResults();
    }
    super.update(changedProps);
  }

  setResults() {
    if (
      this.result &&
      this.result.channels &&
      this.result.channels[0] &&
      this.result.channels[0].alternatives &&
      this.result.channels[0].alternatives[0] &&
      this.result.channels[0].alternatives[0].transcript
    ) {
      this.transcript = this.result.channels[0].alternatives[0].transcript;
      this.requestUpdate();
    }
    if (
      this.result &&
      this.result.channels &&
      this.result.channels[0] &&
      this.result.channels[0].alternatives &&
      this.result.channels[0].alternatives[0] &&
      this.result.channels[0].alternatives[0].summaries
    ) {
      this.summary =
        this.result.channels[0].alternatives[0].summaries[0].summary;
      this.requestUpdate();
    }
    if (
      this.result &&
      this.result.channels &&
      this.result.channels[0] &&
      this.result.channels[0].alternatives &&
      this.result.channels[0].alternatives[0] &&
      this.result.channels[0].alternatives[0].topics
    ) {
      let topicCategories;
      this.result.channels[0].alternatives[0].topics.forEach((topic) => {
        topicCategories = topic.topics;
        topicCategories.forEach((t) => {
          this.topics.push(t.topic);
        });
      });
    }

    if (this.result && this.result.utterances) {
      this.diarize = formatConversation(this.result.utterances);

      function formatConversation(response) {
        const utterances = response;
        const conversation = [];

        let currentSpeaker = -1;
        let currentUtterance = "";

        for (const utterance of utterances) {
          if (utterance.speaker !== currentSpeaker) {
            if (currentUtterance !== "") {
              conversation.push(currentUtterance);
            }

            currentSpeaker = utterance.speaker;
            currentUtterance = `Speaker ${currentSpeaker}: ${utterance.transcript}`;
          } else {
            currentUtterance += ` ${utterance.transcript}`;
          }
        }

        if (currentUtterance !== "") {
          conversation.push(currentUtterance);
        }

        return conversation;
      }
    }
  }

  displayResults() {
    if (this.transcript.length > 0) {
      return html`
        <section>Transcript: ${this.transcript}</section>
        ${this.summary
          ? html` <section>Summary: ${this.summary}</section>`
          : null}
        ${this.topics.length > 0
          ? html` <section>
              Topics:
              ${this.topics &&
              this.topics.map((topic) => html`<div>${topic}</div>`)}
            </section>`
          : null}
        ${this.diarize
          ? html`<section>
              ${this.diarize &&
              this.diarize.map((speaker) => {
                return html`<div class="diarize-section">${speaker}</div>`;
              })}
            </section>`
          : null}
      `;
    } else {
      return null;
    }
  }

  render() {
    return html`<div>${this.displayResults()}</div>`;
  }
}

customElements.define("app-transcript", AppTranscript);
