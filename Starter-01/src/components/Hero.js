import deepgramLogo from "../assets/deepgram.svg";
import nodeLogo from "../assets/node.svg";
import { XMarkIcon } from "@heroicons/react/24/outline";

<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={1.5}
  stroke="currentColor"
  className="w-6 h-6"
>
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
</svg>;

export default function Hero() {
  return (
    <div className="pb-10 lg:pb-20 border-b">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <img src={deepgramLogo} alt="Deepgram logo" className="h-16 mb-3" />
            <XMarkIcon className="h-8" />
            <img src={nodeLogo} alt="Node.js logo" className="mb-3 h-16" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Deepgram Node.js Starter
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            This is a starter application that demonstrates integrating{" "}
            <a className="text-iris" href="https://deepgram.com">
              Deepgram
            </a>
            . This version has a{" "}
            <a className="text-iris" href="https://nodejs.org/">
              Node.js
            </a>{" "}
            server, with a{" "}
            <a className="text-iris" href="https://reactjs.org/">
              React
            </a>{" "}
            client.
          </p>
        </div>
      </div>
    </div>
  );
}
