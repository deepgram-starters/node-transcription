import { Fragment, useState, createRef } from "react";
import { ArrowDownTrayIcon, PlayIcon } from "@heroicons/react/24/outline";
import {
  ExclamationCircleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckIcon,
  ChevronUpDownIcon,
  FolderArrowDownIcon,
  MicrophoneIcon,
  StopIcon,
} from "@heroicons/react/20/solid";
import { Listbox, Transition } from "@headlessui/react";
import { io } from 'socket.io-client';

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const models = [
  {
    model: "general", // Free Accounts
    // model: "general-beta", // Paid Accounts
    name: "Deepgram Nova",
    tier: "enhanced",
  },
  {
    model: "whisper-tiny",
    version: "tiny", // Does not work with Free Accounts
    // version: "medium", // Paid Accounts
    name: "Whisper Cloud",
    tier: "base", // Now required (Docs say it is not https://developers.deepgram.com/docs/model#whisper)
  },
];

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
  const [transcript, setTranscript] = useState('');

  // ui state
  const [done, setDone] = useState();
  const [working, setWorking] = useState();
  const [recording, setRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [useAI, setUseAI] = useState(false);

  // request state
  const [features, setFeatures] = useState({});
  const [file, setFile] = useState();
  const [url, setUrl] = useState(files[0].value);

  const apiOrigin = "http://localhost:3001";

  const [mediaRecorder, setMediaRecorder] = useState();
  const [recordedBlobs, setRecordedBlobs] = useState([]);

  let liveUtterances = [];

  const onSubmitHandler = async (e) => {
    setError();
    setDone(false);
    setWorking(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("features", JSON.stringify(features));
    formData.append("file", file);
    formData.append("url", url);
    formData.append("model", selectedModel.model);

    if (selectedModel.version) {
      formData.append("version", selectedModel.version);
    }

    if (selectedModel.tier) {
      formData.append("tier", selectedModel.tier);
    }

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

  const startRecording = async () => {
    setDone(false);
    setRecordedBlobs([]);
    setHasRecording(false);
    let options = {mimeType: 'audio/webm'};
    let tmpMediaRecorder = null;
    let tmpSocket = null;
    navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        try {
            tmpMediaRecorder = new MediaRecorder(stream, options);
            setMediaRecorder(tmpMediaRecorder);
            tmpSocket = io(apiOrigin, (options = { 
              transports: ["websocket"],
              cors: {}
            }));
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
            return;
        }
        setRecording(true);
        tmpMediaRecorder.onstop = (event) => {
          console.log('Recorder stopped: ', event);
        };
        tmpMediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
              setRecordedBlobs(recordedBlobs => [...recordedBlobs, event.data]);
          }
        };
        // Get live updates every 500ms
        tmpMediaRecorder.start(500);
    }).then(() => {
      tmpSocket.on("connect", () => {
        if (tmpMediaRecorder.state === "inactive") tmpMediaRecorder.start(500);

        tmpMediaRecorder.addEventListener("dataavailable", (event) => {
          tmpSocket.emit("packet-sent", event.data);
        });

        tmpSocket.addEventListener("print-transcript", (msg) => {
          liveUtterances.push({transcript: msg, color: '#000099'});
          setUtterances(liveUtterances);
          setDone(true);

          if(useAI){
            promptAI(msg);
          }
        });
      });
      tmpSocket.on("error", (error) => {
        console.log('Socket.io error: ', error);
      });
      tmpSocket.on("disconnect", (error) => {
        console.log('Socket.io disconnect: ', error);
      });
      tmpSocket.on("connect_error", (error) => {
        console.log('Socket.io connect_error: ', error);
      });
    }).catch((err) => {
      console.error('Media stream creation failed: ', err);
    });
  }

  const stopRecording = () => {
      mediaRecorder.stop();
      setRecording(false);
      setHasRecording(true);
      liveUtterances = [];
      setUtterances(liveUtterances);
      setDone(false);
  }

  const downloadRecording = () => {
      const blob = new Blob(recordedBlobs, {type: 'audio/wav; codecs=0'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'test.wav';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }, 100);
  }

  const promptAI = async (msg) => {
    const response = await fetch(`${apiOrigin}/chat?message=${encodeURIComponent(msg)}`, {
      method: "GET"
    });

    const data = await response.json();

    // Make sure to configure your OpenAI API Key in config.json for this to work
    if(data && !data.err){
      let reply = data.response.data.content;

      liveUtterances.push({transcript: reply, color: '#009900'});
      setUtterances(liveUtterances);

      setDone(true);
    } else {
      alert('Error: You must configure your OpenAI API Key in the config.json to use the "Respond with AI" feature.');
      setUseAI(false);
    }
  }

  const useAIHandler = (e) => {
    setUseAI(!useAI);
  };

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <form onSubmit={onSubmitHandler}>
        <h2 className="text-2xl sm:text-4xl font-semibold mb-4">
          Choose an audio file
        </h2>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 gap-x-4 mx-auto">
          <li className="relative">
            <label
              className="peer-disabled:opacity-50 min-h-full flex flex-col p-5 rounded-lg bg-white px-4 py-5 shadow-lg sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:bg-iris peer-checked:text-white"
              htmlFor="file"
            >
              <FolderArrowDownIcon className="w-8 mb-2 self-center" />
              <p className="text-center lg:text-left">
                Transcribe Live Audio / Record to File.
              </p>
              <div className="self-center">
                <button
                  id="recordButton"
                  type="button"
                  disabled={recording}
                  onClick={startRecording}
                  className="disabled:bg-storm disabled:text-white md:w-auto w-full mr-2 md:px-2 inline-flex justify-center rounded-md bg-meadow py-2 px-3 text-sm font-semibold text-black shadow-sm hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <MicrophoneIcon className="inline w-4 ml-0 mt-[0.1rem]" />
                </button>
                <button
                  id="stopButton"
                  type="button"
                  disabled={!recording}
                  onClick={stopRecording}
                  className="disabled:bg-storm disabled:text-white md:w-auto w-full mr-2 md:px-2 inline-flex justify-center rounded-md bg-meadow py-2 px-3 text-sm font-semibold text-black shadow-sm hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <StopIcon className="inline w-4 ml-0 mt-[0.1rem]" />
                </button>
                <button
                    id="downloadButton"
                    type="button"
                    disabled={!hasRecording}
                    onClick={downloadRecording}
                    className="disabled:bg-storm disabled:text-white md:w-auto w-full md:px-2 inline-flex justify-center rounded-md bg-meadow py-2 px-3 text-sm font-semibold text-black shadow-sm hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <ArrowDownTrayIcon className="inline w-4 ml-0 mt-[0.1rem]" />
                </button>
                <br/>
                <div className="space-y-5">
                  <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                      <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              id="useAI"
                              name="useAI"
                              onChange={useAIHandler}
                            />
                    </div>
                  
                    <div className="ml-3 leading-6">
                      <label
                        htmlFor="useAI"
                        className="font-medium text-gray-900"
                      >
                        Respond with AI
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </li>

          <li className="relative">
            <input
              className="sr-only peer"
              type="radio"
              name="audio"
              ref={audioSelector}
              disabled={working}
            />
            <label
              className="peer-disabled:opacity-50 min-h-full flex flex-col p-5 rounded-lg bg-white px-4 py-5 shadow-lg sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:bg-iris peer-checked:text-white"
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
                className="peer-disabled:opacity-50 min-h-full flex flex-col p-5 rounded-lg bg-white px-4 py-5 shadow-lg sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:bg-iris peer-checked:text-white"
                htmlFor={item.key}
              >
                <DocumentTextIcon className="w-8 mb-2 self-center" />
                <p className="text-center lg:text-left">{item.name}</p>
              </label>
            </li>
          ))}
        </ul>
        <div className="pt-5 flex flex-col md:flex-row justify-end items-center gap-y-3 md:gap-x-3">
          {error && (
            <p className="group inline-flex items-start space-x-2 text-sm text-red-500">
              <ExclamationCircleIcon
                className="h-5 w-5 flex-shrink-0 text-red-500"
                aria-hidden="true"
              />
              <span>{error.message}</span>
            </p>
          )}

          <Listbox
            disabled={working}
            value={selectedModel}
            onChange={setSelectedModel}
          >
            {({ open }) => (
              <>
                <Listbox.Label>Select a transcription model:</Listbox.Label>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                    <span className="block truncate">{selectedModel.name}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {models.map((model) => (
                        <Listbox.Option
                          key={model.model}
                          className={({ active }) =>
                            classNames(
                              active
                                ? "bg-indigo-600 text-white"
                                : "text-gray-900",
                              "relative cursor-default select-none py-2 pl-3 pr-9"
                            )
                          }
                          value={model}
                        >
                          {({ selectedModel, active }) => (
                            <>
                              <span
                                className={classNames(
                                  selectedModel
                                    ? "font-semibold"
                                    : "font-normal",
                                  "block truncate"
                                )}
                              >
                                {model.name}
                              </span>

                              {selectedModel ? (
                                <span
                                  className={classNames(
                                    active ? "text-white" : "text-indigo-600",
                                    "absolute inset-y-0 right-0 flex items-center pr-4"
                                  )}
                                >
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
          <button
            type="submit"
            disabled={working}
            className="disabled:bg-storm disabled:text-white md:w-auto w-full md:px-10 inline-flex justify-center rounded-md bg-meadow py-2 px-3 text-sm font-semibold text-black shadow-sm hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Run
            <PlayIcon className="inline w-4 ml-2 mt-[0.1rem]" />
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
                        <li key={i} className="mb-2" style={{ color: detects.color }}>
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
