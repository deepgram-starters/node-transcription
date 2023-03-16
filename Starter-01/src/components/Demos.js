import { Fragment, useState, createRef } from "react";
import { PlayIcon } from "@heroicons/react/24/outline";
import {
  ExclamationCircleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/20/solid";

const files = [
  {
    key: "podcast",
    name: "Podcast: Deep Learning’s Effect on Science",
    checked: true,
    value:
      "https://res.cloudinary.com/deepgram/video/upload/v1663090404/dg-audio/AI_Show_afpqeh.m4a",
  },
  {
    key: "phone",
    name: "Phone call: First all female NASA Spacewalk",
    checked: false,
    value:
      "https://res.cloudinary.com/deepgram/video/upload/v1663090406/dg-audio/NASA-EXP61_EVA_n5zazi.m4a",
  },
  {
    key: "callcenter",
    name: "Call Center: Upgrade Service",
    checked: false,
    value:
      "https://res.cloudinary.com/deepgram/video/upload/v1663090406/dg-audio/Upgrading-phone-plan_pmfsfm.m4a",
  },
];

const availableFeatures = [
  {
    name: "Punctuation",
    key: "punctuate",
    description:
      "Indicates whether to add punctuation and capitalization to the transcript.",
  },
  {
    name: "Numbers",
    key: "numerals",
    description:
      "Indicates whether to convert numbers from written format (e.g., one) to numerical format (e.g., 1).",
  },
  {
    name: "Redaction",
    key: "redact",
    description:
      "Can redact sensitive credit card information, social security numbers (beta), or any numeric strings.",
  },
  {
    name: "Utterances",
    key: "utterances",
    description:
      "Segments speech into meaningful semantic units. By default, when utterances is enabled, it starts a new utterance after 0.8 s of silence. You can customize the length of time used to determine where to split utterances by submitting the utt_split parameter.",
  },
  {
    name: "Summarization",
    key: "summarize",
    description:
      "Indicates whether Deepgram will provide summaries for sections of content. When Summarization is enabled, Punctuation will also be enabled by default.",
  },
  {
    name: "Topic detection",
    key: "detect_topics",
    description:
      "Indicates whether Deepgram will identify and extract key topics for sections of content.",
  },
  {
    name: "Language detection",
    key: "detect_language",
    description:
      "Identifies the dominant language spoken in submitted audio, transcribes the audio in the identified language, and returns the detected language code in the JSON response.",
  },
];

const featureMap = {
  prerecorded: [
    "punctuate",
    "numerals",
    "redact",
    "utterances",
    "summarize",
    "detect_topics",
    "detect_language",
  ],
  live: ["punctuate", "redact", "numerals"],
};

export default function Demos() {
  const fileInput = createRef();
  const audioSelector = createRef();

  // result state
  const [error, setError] = useState();
  const [utterances, setUtterances] = useState();
  const [summaries, setSummaries] = useState();
  const [topics, setTopics] = useState();
  const [language, setLanguage] = useState();
  const [transcript, setTranscript] = useState();

  // ui state
  const [done, setDone] = useState();
  const [working, setWorking] = useState();

  // request state
  const [features, setFeatures] = useState({});
  const [file, setFile] = useState();
  const [url, setUrl] = useState(files[0].value);

  const apiOrigin = "http://localhost:3001";

  const onSubmitHandler = async (e) => {
    setError();
    setDone(false);
    setWorking(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("features", JSON.stringify(features));
    formData.append("file", file);
    formData.append("url", url);

    try {
      const response = await fetch(`${apiOrigin}/api`, {
        method: "POST",
        body: formData,
      });

      const { err, transcription } = await response.json();

      if (err) throw Error(err);

      setDone(true);
      setWorking(false);

      const { results } = transcription;

      const {
        utterances: resUtterances,
        channels: [
          {
            alternatives: [
              {
                summaries: resSummaries,
                topics: resTopics,
                detected_language: resLanguage,
                transcript: resTranscript,
              },
            ],
          },
        ],
      } = results;

      console.log(results.channels[0].alternatives[0]);

      setUtterances(resUtterances);
      setSummaries(resSummaries);
      setTopics(resTopics);
      setLanguage(resLanguage);
      setTranscript(resTranscript);
    } catch (error) {
      setError(error);
      setWorking(false);
    }
  };

  const selectCdnAudio = (e) => {
    setUrl(e.target.value);
    setFile(null);

    fileInput.current.value = null;
    audioSelector.current.checked = false;
  };

  const selectUploadFile = (e) => {
    setFile(e.target.files[0]);
    setUrl(null);

    audioSelector.current.checked = true;
  };

  const featureChangeHandler = (feature, e) => {
    setFeatures({
      ...features,
      [feature]: e.target.checked,
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <form onSubmit={onSubmitHandler}>
        <h2 className="text-2xl sm:text-4xl font-semibold mb-4">
          Choose an audio file
        </h2>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 mx-auto">
          <li className="relative">
            <input
              className="sr-only peer"
              type="radio"
              name="audio"
              ref={audioSelector}
              disabled={working}
            />
            <label
              className="peer-disabled:opacity-[50%] min-h-full flex flex-col p-5 rounded-lg bg-white px-4 py-5 shadow-lg sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:bg-iris peer-checked:text-white"
              htmlFor="file"
            >
              <CloudArrowUpIcon className="w-8 mb-2 self-center" />
              <p className="text-center lg:text-left">
                Select an audio or video file to transcribe.
              </p>
              <input
                className="sr-only"
                id="file"
                ref={fileInput}
                type="file"
                name="file"
                accept="audio/*,video/*"
                disabled={working}
                onChange={selectUploadFile}
              />
            </label>
          </li>

          {files.map((item) => (
            <li key={item.key} className="relative">
              <input
                className="sr-only peer"
                type="radio"
                name="audio"
                value={item.value}
                defaultChecked={item.checked}
                id={item.key}
                disabled={working}
                onChange={selectCdnAudio}
              />
              <label
                className="peer-disabled:opacity-[50%] min-h-full flex flex-col p-5 rounded-lg bg-white px-4 py-5 shadow-lg sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:bg-iris peer-checked:text-white"
                htmlFor={item.key}
              >
                <DocumentTextIcon className="w-8 mb-2 self-center" />
                <p className="text-center lg:text-left">{item.name}</p>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-end gap-x-5">
          {error && (
            <p className="group inline-flex items-start space-x-2 text-sm text-red-500">
              <ExclamationCircleIcon
                className="h-5 w-5 flex-shrink-0 text-red-500"
                aria-hidden="true"
              />
              <span>{error.message}</span>
            </p>
          )}
          <button
            type="submit"
            disabled={working}
            className="disabled:opacity-[50%] text-xl inline-flex justify-center rounded-md bg-meadow py-2 px-3 font-semibold text-ink shadow-lg hover:bg-darkCharcoal hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Run
            <PlayIcon
              className="h-[1.2rem] w-[1.2rem] mt-[0.25rem] ml-[0.5rem] stroke-2"
              aria-hidden="true"
            />
          </button>
        </div>
        <div className="pt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 gap-x-4">
          <div className="rounded-lg bg-white px-4 py-5 shadow-lg">
            <fieldset>
              <legend className="sr-only">Features</legend>
              <div className="space-y-5">
                {availableFeatures.map((item) => (
                  <div key={item.key} className="relative flex items-start">
                    <div className="flex h-6 items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        id={item.key}
                        name={item.key}
                        disabled={
                          working || !featureMap.prerecorded.includes(item.key)
                        }
                        onChange={(e) => {
                          featureChangeHandler(item.key, e);
                          setDone(false);
                        }}
                      />
                    </div>
                    <div className="ml-3 leading-6">
                      <label
                        htmlFor={item.key}
                        className="font-medium text-gray-900"
                      >
                        {item.name}
                      </label>
                      <p id="offers-description" className="text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="rounded-lg bg-white px-4 py-5 shadow-lg gap-y-1 flex flex-col max-h-[50em] overflow-y-scroll">
            {!done && (
              <Fragment>
                <p>Your results will appear here.</p>
              </Fragment>
            )}
            {done && (
              <Fragment>
                {summaries && (
                  <Fragment>
                    <h4 className="text-xl font-semibold">Summary</h4>
                    {summaries.map((s, i) => (
                      <p key={i}>{s.summary}</p>
                    ))}
                  </Fragment>
                )}
                {topics && (
                  <Fragment>
                    <h4 className="text-xl font-semibold">Topics detected</h4>
                    <ul>
                      {topics.map((detects, i) =>
                        detects.topics.map((t, j) => (
                          <li
                            className="inline [&:not(:last-child)]:after:content-[','] [&:not(:first-child)]:pl-1"
                            key={j}
                          >
                            {t.topic}
                          </li>
                        ))
                      )}
                    </ul>
                  </Fragment>
                )}
                {language && (
                  <Fragment>
                    <h4 className="text-xl font-semibold">Detected language</h4>
                    <p>{JSON.stringify(language)}</p>
                  </Fragment>
                )}
                <Fragment>
                  <h4 className="text-xl font-semibold">Full transcript</h4>
                  <p>{transcript}</p>
                </Fragment>
                {utterances && (
                  <Fragment>
                    <h4 className="text-xl font-semibold">Utterances</h4>
                    <ul>
                      {utterances.map((detects, i) => (
                        <li key={i} className="mb-2">
                          {detects.transcript}
                        </li>
                      ))}
                    </ul>
                  </Fragment>
                )}
              </Fragment>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
