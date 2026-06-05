import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";

const optimizeImageUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.includes("?") ? url : `${url}?w=800&q=auto&f=auto`;
};

// Project card component with animations
function ProjectCard({ project }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  
  return (
    <Link to={`/projects/${project.id}`} key={project.id}>
      <div
        ref={ref}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-700 ease-out
          ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
          hover:scale-105`}
      >
        <div className="absolute -inset-0.5 rounded-2xl bg-[#e8ddd0] blur opacity-0 transition duration-700 group-hover:opacity-60"></div>
        
        <div className="relative rounded-2xl border border-luxuryLine bg-white/80 backdrop-blur-lg transition-all duration-500 hover:border-[#b89b7d]">
          {/* Project Image */}
          {project.images?.[0] && (
            <div className="relative overflow-hidden rounded-t-2xl">
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
          <div className="p-4 space-y-2">
            {/* Title */}
            <h3 className="text-lg font-light text-luxuryInk transition-all duration-300 group-hover:text-[#8b7158]">
              {project.title}
            </h3>
            
            {/* Description */}
            <p className="line-clamp-2 text-sm leading-relaxed text-luxuryMuted">
              {project.description}
            </p>
            
            {/* Hover indicator */}
            <div className="flex items-center space-x-2 pt-1 text-xs text-[#8b7158] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span>View Project</span>
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Category() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        const categoryRes = await fetch(
          `https://interior-portfolio-production.up.railway.app/api/categories/${categoryId}`
        );
        const projectsRes = await fetch(
          `https://interior-portfolio-production.up.railway.app/api/projects/category/${categoryId}`
        );

        const categoryData = await categoryRes.json();
        const projectsData = await projectsRes.json();

        setCategory(categoryData);
        setProjects(projectsData);
      } catch (err) {
        console.error("Error fetching category data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryData();
  }, [categoryId]);

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

  if (!category) {
    return (
      <div className="min-h-screen bg-luxuryBg">
        <div className="max-w-6xl mx-auto px-4 pt-20">
          <div className="text-center py-20">
            <p className="mb-6 text-lg text-luxuryMuted">Category not found.</p>
            <Link 
              to="/" 
              className="inline-flex items-center rounded-full bg-luxuryInk px-6 py-3 text-sm font-light uppercase tracking-wide text-white transition-all duration-500 hover:-translate-y-0.5"
            >
              Back to Home
            </Link>
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
          {/* Back Button */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="group inline-flex items-center text-[#8b7158] transition-colors duration-300 hover:text-luxuryInk"
            >
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span className="text-sm uppercase tracking-wide">Back to Home</span>
            </Link>
          </div>

          {/* Page Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-[#b89b7d] to-transparent"></div>
              <span className="text-sm font-light tracking-[0.2em] uppercase text-[#8b7158]">
                Category
              </span>
              <div className="w-16 h-px bg-gradient-to-l from-[#b89b7d] to-transparent"></div>
            </div>
            
            <h1 className="mb-4 text-4xl font-light tracking-tight text-luxuryInk md:text-5xl">
              {category.name}
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-luxuryMuted">
              Explore our curated collection of {category.name.toLowerCase()} projects, 
              showcasing elegant design solutions and sophisticated craftsmanship.
            </p>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8ddd0]">
                  <svg className="h-8 w-8 text-[#8b7158]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-light text-luxuryInk">No Projects Found</h3>
                <p className="mb-6 text-luxuryMuted">
                  No projects found under this category yet. Check back soon for new additions.
                </p>
                <Link 
                  to="/projects" 
                  className="inline-flex items-center rounded-full bg-luxuryInk px-6 py-3 text-sm font-light uppercase tracking-wide text-white transition-all duration-500 hover:-translate-y-0.5"
                >
                  View All Projects
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Project Count */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-3 rounded-full border border-luxuryLine bg-white/70 px-6 py-2 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-[#b89b7d]"></div>
                  <span className="text-sm text-luxuryMuted">
                    {projects.length} Project{projects.length !== 1 ? 's' : ''} Found
                  </span>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </>
          )}

          {/* Bottom decoration */}
          {/* <div className="flex justify-center mt-16">
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
