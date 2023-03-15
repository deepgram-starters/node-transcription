import { Fragment, useState, createRef } from "react";
// import { getConfig } from "../config";
import { PlayIcon } from "@heroicons/react/24/outline";

import fileIcon from "../assets/file.svg";

const files = [
  {
    key: "phone",
    name: "Phone call: First all female NASA Spacewalk",
    checked: true,
    value:
      "https://res.cloudinary.com/deepgram/video/upload/v1663090406/dg-audio/NASA-EXP61_EVA_n5zazi.m4a",
  },
  {
    key: "podcast",
    name: "Podcast: Deep Learning’s Effect on Science",
    checked: false,
    value:
      "https://res.cloudinary.com/deepgram/video/upload/v1663090404/dg-audio/AI_Show_afpqeh.m4a",
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
  const apiOrigin = "http://localhost:3001";

  // const [state, setState] = useState({
  //   working: false,
  //   showResult: false,
  //   result: "",
  //   error: "",
  // });

  const fileInput = createRef();

  const [audio, setAudio] = useState();
  const [features, setFeatures] = useState({});
  const [file, setFile] = useState();
  const [url, setUrl] = useState(files[0].value);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("audio", audio);
    formData.append("features", JSON.stringify(features));
    formData.append("file", file);
    formData.append("url", url);

    try {
      const response = await fetch(`${apiOrigin}/api`, {
        method: "POST",
        body: formData,
      });
      const responseData = await response.json();
      console.log(responseData);
      // setState({
      //   ...state,
      //   showResult: true,
      //   working: false,
      //   result: responseData,
      // });
    } catch (error) {
      // setState({
      //   ...state,
      //   working: false,
      //   error: error.error,
      // });
    }
  };

  const inputChangeHandler = (setFunction, e) => {
    setFunction(e.target.value);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const resetAttachedAudio = () => {
    fileInput.current.value = null;
    setAudio();
    setFile();
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
              value="upload"
              name="audio"
              id="upload"
              onChange={(e) => {
                inputChangeHandler(setAudio, e);
                setUrl();
              }}
            />
            <label
              className="min-h-[8em] flex flex-col p-5 rounded-lg bg-white px-4 py-5 shadow sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:ring-irisLight peer-checked:ring-2 peer-checked:border-transparent"
              htmlFor="upload"
            >
              Use your own audio.
              <hr className="my-5" />
              <input
                ref={fileInput}
                type="file"
                name="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
              />
            </label>
          </li>

          {files.map((item) => (
            <li key={item.key} className="relative">
              <input
                className="sr-only peer"
                type="radio"
                value={item.value}
                name="audio"
                defaultChecked={item.checked}
                id={item.key}
                onChange={(e) => {
                  inputChangeHandler(setUrl, e);
                  resetAttachedAudio();
                }}
              />
              <label
                className="select-none min-h-[8em] flex p-5 h-full items-start rounded-lg bg-white px-4 py-5 shadow sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:ring-irisLight peer-checked:ring-2 peer-checked:border-transparent"
                htmlFor={item.key}
              >
                <img src={fileIcon} alt="file" className="fill-iris mr-5 w-6" />
                {item.name}
              </label>
            </li>
          ))}
        </ul>
        <div className="pt-5">
          <div className="flex justify-end gap-x-3">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md bg-meadow py-2 px-3 font-semibold text-ink shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Run
              <PlayIcon
                className="h-[1.2rem] w-[1.2rem] mt-[0.1em] ml-[0.5rem] stroke-2"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        <div className="pt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 gap-x-4">
          <div className="rounded-lg bg-white px-4 py-5 shadow">
            <fieldset>
              <legend className="sr-only">Notifications</legend>
              <div className="space-y-5">
                {availableFeatures.map((item) => (
                  <div key={item.key} className="relative flex items-start">
                    <div className="flex h-6 items-center">
                      <input
                        id={item.key}
                        name={item.key}
                        disabled={!featureMap.prerecorded.includes(item.key)}
                        onChange={(e) => {
                          featureChangeHandler(item.key, e);
                        }}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="ml-3  leading-6">
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
          <div className="rounded-lg bg-white px-4 py-5 shadow">
            {/* {state.showResult && ( */}
            <Fragment>
              <p>Your results will appear here.</p>
              <h3 className="text-xl sm:text-2xl font-semibold">
                Transcription results
              </h3>
              <p>
                Hi. Welcome to delicious Pizza company. Can I take your order?
                Yeah. I’d like 2 large cheese Pizzas, please. I’m trying to feed
                a group of 8 people. I can help you with that.
              </p>
              <h3 className="text-xl sm:text-2xl font-semibold mt-3">
                Summarization
              </h3>
              <p>Hi, I'd like to order a pizza.</p>
              <h3 className="text-xl sm:text-2xl font-semibold mt-3">
                Topics detected
              </h3>
              <p>Pizza, food order, delivery</p>
              <h3 className="text-xl sm:text-2xl font-semibold mt-3">
                Languages detected
              </h3>
              <p>English</p>
            </Fragment>
            {/* )} */}
          </div>
        </div>
      </form>
    </div>
  );
}
