import { useEffect, useRef, useState } from "react";

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const LERP_FACTOR = 0.12;
const SNAP_THRESHOLD = 0.0005;

export default function ScrollHero() {
  const [heroReady, setHeroReady] = useState(false);
  const videoRef = useRef(null);
  const textLayerRef = useRef(null);
  const overlayRef = useRef(null);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafIdRef = useRef(null);
  const isRunningRef = useRef(false); // ← الإضافة الوحيدة

  useEffect(() => {
    const video = videoRef.current;

    const seekVideo = (progress) => {
      const v = videoRef.current;
      if (!v || v.readyState < 2 || !Number.isFinite(v.duration) || v.duration <= 0) return;
      const targetTime = progress * v.duration;
      const frameDuration = 1 / 24;
      if (Math.abs(v.currentTime - targetTime) > frameDuration * 0.4) {
        if (typeof v.fastSeek === "function") {
          v.fastSeek(targetTime);
        } else {
          v.currentTime = targetTime;
        }
      }
    };

    const updateVisuals = (progress) => {
      const textOpacity = 1 - clamp((progress - 0.25) / 0.25);
      const textTranslateY = clamp((progress - 0.25) / 0.25) * -72;
      const textBlur = clamp((progress - 0.25) / 0.25) * 12;
      const overlayOpacity = 0.38 * textOpacity + 0.1;
      if (textLayerRef.current) {
        textLayerRef.current.style.opacity = textOpacity;
        textLayerRef.current.style.transform = `translate3d(0, ${textTranslateY}px, 0)`;
        textLayerRef.current.style.filter = `blur(${textBlur}px)`;
        textLayerRef.current.style.pointerEvents = textOpacity < 0.05 ? "none" : "auto";
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = overlayOpacity;
      }
    };

    const tick = () => {
      const target = targetProgressRef.current;
      let current = currentProgressRef.current;
      const diff = target - current;

      if (Math.abs(diff) < SNAP_THRESHOLD) {
        // وصلنا للهدف — وقّف اللووب
        current = target;
        currentProgressRef.current = current;
        updateVisuals(current);
        seekVideo(current);
        isRunningRef.current = false;
        return; // ← ما نطلب frame جديد
      }

      current += diff * LERP_FACTOR;
      currentProgressRef.current = current;
      updateVisuals(current);
      seekVideo(current);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    const handleScroll = () => {
      const sectionScrollable = Math.max(window.innerHeight * 4, 1);
      targetProgressRef.current = clamp(window.scrollY / sectionScrollable);
      // شغّل اللووب بس لو مو شغّال
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    const handleVideoReady = () => {
      setHeroReady(true);
      handleScroll();
      currentProgressRef.current = targetProgressRef.current;
      seekVideo(currentProgressRef.current);
      updateVisuals(currentProgressRef.current);
    };

    if (video) {
      video.addEventListener("loadeddata", handleVideoReady, { once: true });
      if (video.readyState >= 2) handleVideoReady();
    }

    handleScroll();
    currentProgressRef.current = targetProgressRef.current;
    updateVisuals(currentProgressRef.current);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      if (video) video.removeEventListener("loadeddata", handleVideoReady);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

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
          ref={overlayRef}
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.08)_52%,rgba(0,0,0,0.18))]"
          style={{ opacity: 0.48 }}
        />
        <div
          ref={textLayerRef}
          className="absolute inset-0 flex items-center justify-center px-6 pb-48"
          style={{ opacity: 1, transform: "translate3d(0, 0px, 0)" }}
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
