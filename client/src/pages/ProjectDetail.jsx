// client/src/pages/ProjectDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const optimizeImageUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.includes("?") ? url : `${url}?w=800&q=auto&f=auto`;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://interior-portfolio-production.up.railway.app/api/projects/${id}`);
        if (!res.ok) throw new Error("Failed to fetch project");
        const data = await res.json();
        setProject(data);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeydown = (e) => {
      if (!lightboxOpen) return;
      
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [lightboxOpen, currentImageIndex]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [lightboxOpen]);

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNext = () => {
    if (!project?.images) return;
    setCurrentImageIndex((prev) => 
      prev === project.images.length - 1 ? 0 : prev + 1
    );
  };

  const goToPrevious = () => {
    if (!project?.images) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? project.images.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-luxuryBg">
        <div className="max-w-5xl mx-auto px-4 pt-20">
          <div className="flex justify-center items-center py-20">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border border-luxuryLine"></div>
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#b89b7d] border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-luxuryBg">
        <div className="max-w-5xl mx-auto px-4 pt-20">
          <div className="text-center py-20">
            <p className="inline-block rounded-lg border border-[#d6b7a7] bg-white/80 px-6 py-4 text-[#9a5a42] backdrop-blur-sm">
              {err}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-luxuryBg">
        <div className="max-w-5xl mx-auto px-4 pt-20">
          <div className="text-center py-20">
            <p className="text-lg text-luxuryMuted">Project not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxuryBg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(250,250,248,0.96)_45%,_rgba(245,240,232,1)_100%)]"></div>
      
      <div className="relative">
        <section className="max-w-5xl mx-auto px-4 pt-20 pb-16">
          {/* Back Button */}
          <div className="mb-8">
            <Link 
              to="/projects" 
              className="group inline-flex items-center text-[#8b7158] transition-colors duration-300 hover:text-luxuryInk"
            >
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span className="text-sm uppercase tracking-wide">Back to Projects</span>
            </Link>
          </div>

          {/* Project Header */}
          <div className="mb-12">
            {/* Title */}
            <h1 className="mb-4 text-4xl font-light tracking-tight text-luxuryInk md:text-5xl">
              {project.title}
            </h1>

            {/* Category */}
            {project.category && (
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-2 w-2 rounded-full bg-[#b89b7d]"></div>
                <span className="text-sm font-light tracking-wide uppercase text-[#8b7158]">
                  {project.category}
                </span>
              </div>
            )}

            {/* Description */}
            {project.description && (
              <div className="max-w-3xl">
                <p className="text-lg font-light leading-relaxed text-luxuryMuted">
                  {project.description}
                </p>
              </div>
            )}
          </div>

          {/* Main image */}
          {project.images?.[0] && (
            <div className="relative group mb-8">
              <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-[#e8ddd0] blur opacity-40 transition duration-1000 group-hover:opacity-60"></div>
              <img
                src={optimizeImageUrl(project.images[0].path)}
                alt={project.title}
                className="relative z-10 w-full cursor-pointer rounded-2xl border border-luxuryLine shadow-2xl transition-all duration-500 hover:border-[#b89b7d]"
                onClick={() => openLightbox(0)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          )}

          {/* Extra images */}
          {project.images && project.images.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {project.images.slice(1).map((img, i) => (
                <div key={i} className="relative group">
                  <div className="absolute -inset-0.5 rounded-xl bg-[#e8ddd0] blur opacity-0 transition duration-700 group-hover:opacity-50"></div>
                  <div className="relative">
                    <img
                      src={optimizeImageUrl(img.path)}
                      alt={`${project.title}-${i + 2}`}
                      className="h-48 w-full cursor-pointer rounded-xl border border-luxuryLine object-cover transition-all duration-300 hover:scale-105 hover:border-[#b89b7d]"
                      loading="lazy"
                      onClick={() => openLightbox(i + 1)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Original Lightbox Modal - Only styled, functionality unchanged */}
      {lightboxOpen && project.images && (
        <div 
          className="fixed inset-0 z-50 h-screen w-screen bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 rounded-full border border-white/15 bg-white/10 p-2 text-3xl text-white/70 transition-all duration-300 hover:border-[#d8c4ac] hover:bg-[#d8c4ac]/20 hover:text-white"
            aria-label="Close lightbox"
          >
            ✕
          </button>

          {/* Image counter */}
          <div
            className="absolute top-4 left-4 z-10 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/70 backdrop-blur-sm"
            aria-live="polite"
          >
            {currentImageIndex + 1} / {project.images.length}
          </div>

          {/* Previous button */}
          {project.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-3 text-4xl text-white/70 transition-all duration-300 hover:border-[#d8c4ac] hover:bg-[#d8c4ac]/20 hover:text-white"
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          {/* Next button */}
          {project.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-3 text-4xl text-white/70 transition-all duration-300 hover:border-[#d8c4ac] hover:bg-[#d8c4ac]/20 hover:text-white"
              aria-label="Next image"
            >
              ›
            </button>
          )}

          {/* Main image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={optimizeImageUrl(project.images[currentImageIndex].path)}
              alt={`${project.title}-${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Instructions text */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-center text-sm text-white/50 backdrop-blur-sm">
            <p className="hidden md:block">Use arrow keys or click buttons to navigate • ESC to close</p>
            <p className="md:hidden">Tap arrows to navigate • Tap outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
