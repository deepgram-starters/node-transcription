import dgLogo from "../assets/deepgram.svg";

export default function Footer() {
  return (
    <footer className="bg-darkCharcoal mt-20" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32 flex flex-col items-center flex-grow">
        <img
          className="h-7 mb-2"
          src={dgLogo}
          alt="Company name"
        />
        <p className="text-white">Starter application provided by <a className="text-lightIris" href="https://deepgram.com">Deepgram</a></p>
      </div>
    </footer>
  )
}
