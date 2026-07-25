import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-36 end-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-primary/30 bg-card/80 text-primary shadow-lg backdrop-blur transition hover:scale-110 hover:bg-primary hover:text-background md:bottom-24"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
