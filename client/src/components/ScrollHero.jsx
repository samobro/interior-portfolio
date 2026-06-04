import { useEffect, useRef, useState } from "react";

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export default function ScrollHero() {
  const [heroReady, setHeroReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const handleCanPlay = () => setHeroReady(true);

    if (video) {
      video.addEventListener("canplay", handleCanPlay, { once: true });
    }

    const updateFromScroll = () => {
      const sectionScrollable = Math.max(window.innerHeight * 4, 1);
      const pageScroll = window.scrollY;
      const progress = clamp(pageScroll / sectionScrollable);

      setScrollProgress(progress);

      if (videoRef.current && videoRef.current.readyState >= 2) {
        videoRef.current.currentTime = progress * videoRef.current.duration;
      }
    };

    updateFromScroll();

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        updateFromScroll();
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (video) {
        video.removeEventListener("canplay", handleCanPlay);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const textOpacity = 1 - clamp((scrollProgress - 0.25) / 0.25);
  const textTranslateY = clamp((scrollProgress - 0.25) / 0.25) * -72;
  const textBlur = clamp((scrollProgress - 0.25) / 0.25) * 12;
  const overlayOpacity = 0.38 * textOpacity + 0.1;

  return (
    <section className="relative h-[300vh] sm:h-[500vh] w-full bg-luxuryBg">
      <div className="sticky top-0 h-screen w-screen overflow-hidden">
        <div className="absolute inset-0 bg-[#ddd2c3]" />

        {!heroReady && (
          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,_rgba(255,255,255,0.7),_rgba(232,221,208,0.82),_rgba(255,255,255,0.7))]" />
        )}

        <video
          ref={videoRef}
          src="/videos/hero.mp4"
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 ${
            heroReady ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.08)_52%,rgba(0,0,0,0.18))]" />

        <div
          className="absolute inset-0 flex items-center justify-center px-6"
          style={{
            opacity: textOpacity,
            transform: `translate3d(0, ${textTranslateY}px, 0)`,
            filter: `blur(${textBlur}px)`,
            pointerEvents: textOpacity < 0.05 ? "none" : "auto",
          }}
        >
          <div
            className="rounded-[2rem] px-4 py-6 text-center backdrop-blur-[3px] sm:px-8 sm:py-10"
            style={{
              background: `rgba(34, 28, 22, ${overlayOpacity})`,
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.16)",
            }}
          >
            <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.34em] text-white/82 sm:mb-5">
              Interior Design
            </p>
            <h1 className="font-display text-3xl leading-[0.95] text-white sm:text-5xl lg:text-8xl">
              <span className="block">Designing calm</span>
              <span className="block">light-filled homes</span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
