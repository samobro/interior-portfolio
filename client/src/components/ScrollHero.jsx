import { useEffect, useRef, useState } from "react";

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export default function ScrollHero() {
  const [heroReady, setHeroReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const handleVideoReady = () => {
      setHeroReady(true);
      updateFromScroll();
    };

    const seekVideo = (progress) => {
      const currentVideo = videoRef.current;
      if (
        !currentVideo ||
        currentVideo.readyState < 1 ||
        !Number.isFinite(currentVideo.duration) ||
        currentVideo.duration <= 0
      ) {
        return;
      }

      try {
        currentVideo.currentTime = progress * currentVideo.duration;
      } catch (error) {
        console.warn("Unable to seek hero video yet:", error);
      }
    };

    const updateFromScroll = () => {
      const sectionScrollable = Math.max(window.innerHeight * 4, 1);
      const pageScroll = window.scrollY;
      const progress = clamp(pageScroll / sectionScrollable);

      setScrollProgress(progress);

      seekVideo(progress);
    };

    if (video) {
      video.addEventListener("loadedmetadata", handleVideoReady, { once: true });
      video.addEventListener("canplay", handleVideoReady, { once: true });
      if (video.readyState >= 1) {
        handleVideoReady();
      }
    }

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
        video.removeEventListener("loadedmetadata", handleVideoReady);
        video.removeEventListener("canplay", handleVideoReady);
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
          src={`${import.meta.env.BASE_URL}frames/hero.mp4`}
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 ${
            heroReady ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.08)_52%,rgba(0,0,0,0.18))]"
          style={{ opacity: overlayOpacity }}
        />

        <div
          className="absolute inset-0 flex items-center justify-center px-6 pb-48"
          style={{
            opacity: textOpacity,
            transform: `translate3d(0, ${textTranslateY}px, 0)`,
            filter: `blur(${textBlur}px)`,
            pointerEvents: textOpacity < 0.05 ? "none" : "auto",
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="A.Interiors logo"
            className="w-64 object-contain drop-shadow-xl sm:w-80 lg:w-96"
          />
        </div>
      </div>
    </section>
  );
}
