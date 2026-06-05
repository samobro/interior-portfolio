import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ScrollHero from "../components/ScrollHero.jsx";
import CategoryCard from "../components/CategoryCard.jsx";
import { fetchCategories } from "../utils/api.js";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [aboutImageLoaded, setAboutImageLoaded] = useState(false);
  const location = useLocation();
  const categoriesScrollRef = useRef(null);

  const scrollCategories = (direction) => {
    if (!categoriesScrollRef.current) return;
    categoriesScrollRef.current.scrollBy({
      left: direction === "left" ? -400 : 400,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!location.state?.scrollTo) return;

    const targetId = location.state.scrollTo;

    const waitForElAndScroll = (id, maxWait = 1000) => {
      const start = Date.now();
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          const yOffset = -64;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        if (Date.now() - start < maxWait) {
          requestAnimationFrame(tryScroll);
        } else {
          const fallbackEl = document.getElementById(id);
          if (fallbackEl) {
            const yOffset = -64;
            const y = fallbackEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      tryScroll();
    };

    waitForElAndScroll(targetId, 1200);
  }, [location]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (e) {
        setErr(e.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-luxuryBg text-luxuryInk">
      <ScrollHero />

      <section id="categories" className="relative overflow-hidden py-24 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.85),_rgba(245,240,232,0.92)_55%,_rgba(232,221,208,0.78)_100%)]" />
        <div className="absolute right-[-8%] top-10 h-64 w-64 rounded-full bg-white/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 md:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <div className="max-w-xl space-y-5">
              <p className="text-sm uppercase tracking-[0.28em] text-luxuryMuted">Design Categories</p>
              <h2 className="font-display text-4xl leading-none text-luxuryInk sm:text-5xl md:text-6xl">
                Spaces tailored with warmth, restraint, and detail.
              </h2>
              <p className="text-base leading-8 text-luxuryMuted sm:text-lg">
                Each category reflects a different kind of living: calm residential retreats, polished
                hospitality settings, and intimate rooms layered with texture and light.
              </p>
            </div>

            <div className="rounded-[2rem] border border-luxuryLine bg-white/70 p-6 shadow-[0_20px_60px_rgba(121,99,77,0.08)] backdrop-blur-sm sm:p-7">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Approach</p>
                  <p className="mt-2 font-display text-3xl text-luxuryInk">Timeless</p>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Palette</p>
                  <p className="mt-2 font-display text-3xl text-luxuryInk">Light</p>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Categories</p>
                  <p className="mt-2 font-display text-3xl text-luxuryInk">
                    {loading ? "--" : String(categories.length).padStart(2, "0")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-14">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border border-luxuryLine" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#b89b7d] border-t-transparent" />
              </div>
            </div>
          )}

          {err && (
            <div className="py-8 text-center">
              <p className="inline-block rounded-full border border-[#d6b7a7] bg-white/80 px-5 py-3 text-sm text-[#9a5a42]">
                {err}
              </p>
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollCategories("left")}
              className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-luxuryLine bg-white/80 p-3 text-luxuryInk shadow-md transition hover:bg-white lg:inline-flex"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollCategories("right")}
              className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-luxuryLine bg-white/80 p-3 text-luxuryInk shadow-md transition hover:bg-white lg:inline-flex"
            >
              <span aria-hidden="true">→</span>
            </button>

            <div
              ref={categoriesScrollRef}
              className="scrollbar-hide flex gap-6 overflow-x-auto px-1 py-10 touch-pan-x"
              style={{
                overflowY: "hidden",
                WebkitOverflowScrolling: "touch",
              }}
              onTouchStart={(e) => {
                e.currentTarget.touchStartY = e.touches[0].clientY;
                e.currentTarget.touchStartX = e.touches[0].clientX;
              }}
              onTouchMove={(e) => {
                const touchY = e.touches[0].clientY;
                const startY = e.currentTarget.touchStartY;
                const deltaY = Math.abs(touchY - startY);
                const deltaX = Math.abs(
                  e.touches[0].clientX - (e.currentTarget.touchStartX || e.touches[0].clientX)
                );

                if (deltaX > deltaY) {
                  e.preventDefault();
                }
              }}
            >
              {categories.map((category) => (
                <CategoryCard key={category.id} item={category} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative overflow-hidden py-24 sm:py-28">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(250,250,248,0.88),_rgba(245,240,232,0.98))]" />
        <div className="absolute left-[-6%] top-1/3 h-72 w-72 rounded-full bg-white/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 md:px-8 lg:px-12">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
            <div className="relative">
              <div className="absolute -left-6 top-10 hidden h-40 w-40 rounded-full border border-luxuryLine/70 lg:block" />
              <div className="absolute -right-6 bottom-10 hidden h-28 w-28 rounded-full bg-white/75 blur-xl lg:block" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-3 shadow-[0_30px_90px_rgba(117,90,64,0.14)] backdrop-blur-sm">
                {!aboutImageLoaded && (
                  <div className="absolute inset-3 animate-pulse rounded-[1.5rem] bg-[linear-gradient(120deg,_rgba(255,255,255,0.7),_rgba(232,221,208,0.8),_rgba(255,255,255,0.7))]">
                    <div className="absolute inset-0 bg-white/20" />
                  </div>
                )}

                <img
                  src={`${import.meta.env.BASE_URL}hero-bg.png`}
                  alt="Interior designer portrait"
                  className={`mx-auto h-full min-h-[360px] w-full rounded-[1.5rem] object-cover transition-opacity duration-700 ${
                    aboutImageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ maxHeight: "620px", width: "100%", objectFit: "cover" }}
                  loading="eager"
                  onLoad={() => setAboutImageLoaded(true)}
                  onError={() => setAboutImageLoaded(true)}
                />
                <div className="absolute bottom-7 left-7 rounded-full border border-white/75 bg-white/82 px-4 py-3 text-xs uppercase tracking-[0.3em] text-luxuryMuted shadow-sm">
                  Thoughtful layers
                </div>
              </div>
            </div>

            <div className="space-y-7">
              <p className="text-sm uppercase tracking-[0.28em] text-luxuryMuted">About the Studio</p>
              <h2 className="max-w-xl font-display text-4xl leading-none text-luxuryInk sm:text-5xl md:text-6xl">
                A residential approach shaped by light, texture, and ease.
              </h2>

              <div className="max-w-2xl space-y-5 text-base leading-8 text-luxuryMuted sm:text-lg">
                <p>
                  The studio focuses on spaces that feel serene from the first impression and deeply livable
                  once you step inside. Every composition balances softness, precision, and practical comfort.
                </p>
                <p>
                  Materials are selected for calm texture, warm tonality, and longevity, creating interiors
                  that feel elegant today and effortless for years to come.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-luxuryLine bg-white/70 p-6">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Specialty</p>
                  <p className="mt-3 font-display text-3xl text-luxuryInk">Quiet Luxury</p>
                </div>
                <div className="rounded-[1.75rem] border border-luxuryLine bg-white/70 p-6">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Result</p>
                  <p className="mt-3 font-display text-3xl text-luxuryInk">Timeless Rooms</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-luxuryInk px-7 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Start a Conversation
                </a>
                <a
                  href="/cv.pdf"
                  download
                  className="inline-flex items-center justify-center rounded-full border border-luxuryLine bg-white/70 px-7 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-luxuryInk transition-colors duration-300 hover:bg-white"
                >
                  Download CV
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="relative overflow-hidden px-5 pb-24 pt-6 sm:px-8 sm:pb-28 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-luxuryLine bg-[linear-gradient(135deg,_rgba(255,255,255,0.9),_rgba(245,240,232,0.98)_58%,_rgba(232,221,208,0.95))] px-6 py-12 shadow-[0_26px_90px_rgba(121,99,77,0.12)] sm:px-10 md:py-14 lg:px-14">
            <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-white/80 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-[#ece0d1]/85 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-2xl space-y-5">
                <p className="text-sm uppercase tracking-[0.28em] text-luxuryMuted">Contact</p>
                <h2 className="font-display text-4xl leading-none text-luxuryInk sm:text-5xl md:text-6xl">
                  Ready to create a lighter, more luxurious home?
                </h2>
                <p className="text-base leading-8 text-luxuryMuted sm:text-lg">
                  Reach out for residential design inquiries, project collaborations, or a portfolio review.
                  The process begins with conversation, clarity, and a strong sense of how you want the space to feel.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[340px]">
                <a
                  href="mailto:shaimaaemad2020@gmail.com"
                  className="rounded-[1.5rem] border border-white/75 bg-white/72 p-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Email</p>
                  <p className="mt-3 text-sm font-medium text-luxuryInk sm:text-base">
                    shaimaaemad2020@gmail.com
                  </p>
                </a>
                <a
                  href="https://www.instagram.com/shaimaa_alathwary"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[1.5rem] border border-white/75 bg-white/72 p-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Instagram</p>
                  <p className="mt-3 text-sm font-medium text-luxuryInk sm:text-base">
                    @shaimaa_alathwary
                  </p>
                </a>
                <a
                  href="https://www.facebook.com/Shaimaa Al-athwary"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[1.5rem] border border-white/75 bg-white/72 p-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Facebook</p>
                  <p className="mt-3 text-sm font-medium text-luxuryInk sm:text-base">
                    Shaimaa Al-athwary
                  </p>
                </a>
                <div className="rounded-[1.5rem] border border-white/75 bg-white/72 p-5">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-luxuryMuted">Availability</p>
                  <p className="mt-3 text-sm font-medium text-luxuryInk sm:text-base">
                    New residential inquiries welcome
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
