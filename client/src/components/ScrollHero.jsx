import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export const computeCoverScale = (cw, ch, vw, vh) => {
  const scale = Math.max(cw / vw, ch / vh);
  const drawW = vw * scale;
  const drawH = vh * scale;
  return { drawW, drawH, scale };
};

export default function ScrollHero() {
  const [heroReady, setHeroReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const targetTimeRef = useRef(0);

  const drawFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    const cw = canvas.width;
    const ch = canvas.height;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    const { drawW, drawH } = computeCoverScale(cw, ch, vw, vh);
    const offsetX = (cw - drawW) / 2;
    const offsetY = (ch - drawH) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
  };

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!section || !video || !canvas) return;

    const setProgress = (value) => {
      const progress = clamp(value);
      scrollProgressRef.current = progress;
      setScrollProgress(progress);

      if (video.duration) {
        targetTimeRef.current = progress * video.duration;
      }
    };

    const syncSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame();
    };

    const scheduleFrame = () => {
      rafRef.current = requestAnimationFrame(() => {
        if (video.duration) {
          video.currentTime += (targetTimeRef.current - video.currentTime) * 0.12;
        }
        drawFrame();
        scheduleFrame();
      });
    };

    const handleCanPlay = () => {
      setHeroReady(true);
      setProgress(scrollProgressRef.current);
      scheduleFrame();
    };

    syncSize();
    window.addEventListener("resize", syncSize);

    const scrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => setProgress(self.progress),
      onRefresh: (self) => setProgress(self.progress),
    });

    if (video.readyState >= 2) {
      handleCanPlay();
    } else {
      video.addEventListener("canplay", handleCanPlay, { once: true });
    }

    setProgress(scrollTrigger.progress);

    return () => {
      window.removeEventListener("resize", syncSize);
      video.removeEventListener("canplay", handleCanPlay);
      scrollTrigger.kill();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const textOpacity = 1 - clamp((scrollProgress - 0.25) / 0.25);
  const textTranslateY = clamp((scrollProgress - 0.25) / 0.25) * -72;
  const textBlur = clamp((scrollProgress - 0.25) / 0.25) * 12;
  const overlayOpacity = 0.38 * textOpacity + 0.1;

  return (
    <section ref={sectionRef} className="relative h-[300vh] sm:h-[500vh] w-full bg-luxuryBg">
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
          className="hidden"
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
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
