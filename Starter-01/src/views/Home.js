import Demos from "../components/Demos";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <div className="flex-grow">
      <Hero />
      <Demos />
    </div>
  )
}