import fileIcon from "../assets/file.svg";

const files = [
  { key: 'phone', name: 'Phone call: First all female NASA Spacewalk', value: 'https://cdn.deepgram.etc/file.m4a' },
  { key: 'podcast', name: 'Podcast: How ChatCPT is changing the AI world', value: 'https://cdn.deepgram.etc/file.m4a' },
  { key: 'live', name: 'Live audio: Live stream from BBC radio', value: 'https://cdn.deepgram.etc/file.m4a' },
]

export default function Demos() {
  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-4 gap-x-4 mx-auto">
        <li className="relative">
          <input className="sr-only peer" type="radio" value="yes" name="audio" id="answer_yes" />
          <label className="flex flex-col p-5 rounded-lg bg-white px-4 py-5 shadow sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:ring-irisLight peer-checked:ring-2 peer-checked:border-transparent" htmlFor="answer_yes">
            Use your own audio.
            <hr className="my-5" />
            <input type="file" id="avatar" name="avatar" accept="image/png, image/jpeg" />
          </label>
        </li>

        {files.map((item) => (
          <li key={item.key} className="relative">
            <input className="sr-only peer" type="radio" value={item.value} name="audio" id={item.key} />
            <label className="flex p-5 h-full items-start rounded-lg bg-white px-4 py-5 shadow sm:p-6 cursor-pointer focus:outline-none hover:bg-gray-50 peer-checked:ring-irisLight peer-checked:ring-2 peer-checked:border-transparent" htmlFor={item.key}>
              <img src={fileIcon} alt="file" className="fill-iris mr-5 w-6"/>{ item.name }
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <button className="rounded-md w-36 bg-meadow px-3.5 py-2.5 text-2xl font-semibold text-darkCharcoal shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Transcribe audio
        </button>
        <button className="rounded-md w-36 bg-meadow px-3.5 py-2.5 text-2xl font-semibold text-darkCharcoal shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Summarize audio
        </button>
        <button className="rounded-md w-36 bg-meadow px-3.5 py-2.5 text-2xl font-semibold text-darkCharcoal shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Detect language
        </button>
        <button className="rounded-md w-36 bg-meadow px-3.5 py-2.5 text-2xl font-semibold text-darkCharcoal shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Topic detection
        </button>
      </div>
      <div className="mt-10 flex items-center justify-center gap-x-6 rounded-lg bg-white px-4 py-5 shadow">
        Hi. Welcome to delicious Pizza company. Can I take your order? Yeah. I’d like 2 large cheese Pizzas, please. I’m trying to feed a group of 8 people. I can help you with that. Can you please provide your name and your credit card number for payment? Yeah. Sure. My name is Jane Smith, and my credit card number is * can you please provide the expiration date and security code? Yeah. It expires in * the security code is * I have you down for 2 large cheese pizzas. Please go around to the pickup window. We’ll have your pizza ready in around 5 minutes. Thanks for choosing delicious pizza company.
      </div>
    </div>
  )
}