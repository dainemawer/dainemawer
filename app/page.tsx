import { About } from "@/components/About/About";
import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";
import { Work } from "@/components/Work/Work";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        <Hero />
        <About />
        <Work />
      </main>
    </>
  );
}
