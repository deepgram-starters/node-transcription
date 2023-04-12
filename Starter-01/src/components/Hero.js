import deepgramLogo from "../assets/deepgram.svg";
import { SiGithub } from "@icons-pack/react-simple-icons";

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
          <div className="mt-10 mb-5 flex justify-center">
            <img src={deepgramLogo} alt="Deepgram logo" className="h-16 mb-3" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Deepgram Node Starter
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            This is a starter application that demonstrates integrating{" "}
            <a className="text-iris" href="https://deepgram.com">
              Deepgram
            </a>
            . This version has a{" "}
            <a className="text-iris" href="https://nodejs.org">
              Node Express
            </a>{" "}
            server, with a static React client.
          </p>
          <div className="mt-5 flex items-center justify-center gap-x-5">
            <a
              href="https://github.com/deepgram-starters/deepgram-javascript-starters/tree/main/Starter-01"
              target="_blank"
              rel="noreferrer"
              className="text-xl inline-flex justify-center rounded-md bg-ink py-2 px-3 font-semibold text-white shadow-lg hover:bg-darkCharcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <SiGithub className="inline h-[1.2rem] w-[1.2rem] mt-[0.25rem] mr-[0.5rem] stroke-2" />{" "}
              View the code on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
