import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        <Hero />
      </main>
    </>
  );
}
