import { useEffect, useState } from "react";
import { fetchProjects } from "../utils/api";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";

const optimizeImageUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.includes("?") ? url : `${url}?w=800&q=auto&f=auto`;
};

// Separate component for each project card
function ProjectCard({ project }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  
  return (
    <Link
      to={`/projects/${project.id}`}
      ref={ref}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-700 ease-out
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        hover:scale-105`}
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-[#e8ddd0] blur opacity-0 transition duration-700 group-hover:opacity-60"></div>
      
      <div className="relative rounded-2xl border border-luxuryLine bg-white/80 p-4 backdrop-blur-lg transition-all duration-500 hover:border-[#b89b7d]">
        {/* Project Image */}
        {project.images?.[0] && (
          <div className="relative mb-4 overflow-hidden rounded-xl">
            <img
              src={optimizeImageUrl(project.images[0].path)}
              alt={project.title}
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Image overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
        
        {/* Project Info */}
        <div className="space-y-2">
          {/* Category */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#b89b7d] rounded-full"></div>
            <span className="text-xs text-[#8b7158] tracking-wide uppercase">{project.category}</span>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-light text-luxuryInk transition-all duration-300 group-hover:text-[#8b7158]">
            {project.title}
          </h3>
          
          {/* Description */}
          <p className="line-clamp-3 text-sm leading-relaxed text-luxuryMuted">
            {project.description}
          </p>
          
          {/* Hover indicator */}
          <div className="flex items-center space-x-2 pt-2 text-xs text-[#8b7158] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span>View Project</span>
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-luxuryBg">
        <div className="max-w-6xl mx-auto px-4 pt-20">
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
        <div className="max-w-6xl mx-auto px-4 pt-20">
          <div className="text-center py-20">
            <p className="inline-block rounded-lg border border-[#d6b7a7] bg-white/80 px-6 py-4 text-[#9a5a42] backdrop-blur-sm">
              {err}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="min-h-screen bg-luxuryBg">
        <div className="max-w-6xl mx-auto px-4 pt-20">
          <div className="text-center py-20">
            <p className="text-lg text-luxuryMuted">No projects found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxuryBg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(250,250,248,0.96)_45%,_rgba(245,240,232,1)_100%)]"></div>
      
      <div className="relative">
        <section className="max-w-6xl mx-auto px-4 pt-20 pb-16">
          {/* Page Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-[#b89b7d] to-transparent"></div>
              <span className="text-sm font-light tracking-[0.2em] uppercase text-[#8b7158]">
                Portfolio
              </span>
              <div className="w-16 h-px bg-gradient-to-l from-[#b89b7d] to-transparent"></div>
            </div>
            
            <h1 className="mb-4 text-4xl font-light tracking-tight text-luxuryInk md:text-5xl">
              Our <span className="font-extralight text-[#8b7158]">Projects</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-luxuryMuted">
              Discover our carefully curated collection of luxury interior designs, 
              each project telling its own story of elegance and sophistication.
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          {/* Bottom decoration
          <div className="flex justify-center mt-16">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div> */}
        </section>
      </div>
    </div>
  );
}
