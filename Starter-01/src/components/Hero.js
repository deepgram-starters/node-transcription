import javascriptLogo from "../assets/javascript.svg";

export default function Hero() {
  return (
    <div className="pb-10 lg:pb-20 border-b">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <img className="mb-3 app-logo" src={javascriptLogo} alt="React logo" width="120" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            JavaScript Starter App
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            This is a starter application that demonstrates integrating <a className="text-iris" href="https://deepgram.com">Deepgram</a> with JavaScript and Node.js
          </p>
        </div>
      </div>
    </div>
  )
}
