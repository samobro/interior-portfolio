// src/components/Navbar.jsx
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const cvHref = `${import.meta.env.BASE_URL}cv.pdf`;
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSectionLocal = (id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    
    // Calculate navbar height dynamically
    const navbar = document.querySelector('header');
    const navbarHeight = navbar ? navbar.offsetHeight : 64;
    const additionalOffset = 20; // Extra spacing from top
    const NAV_Y_OFFSET = -(navbarHeight + additionalOffset);
    
    const y = el.getBoundingClientRect().top + window.pageYOffset + NAV_Y_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
    return true;
  };

  // Called by both desktop and mobile links
  const handleNavClick = (sectionId) => {
    setMenuOpen(false);

    // If we're already on home, try scrolling immediately
    if (location.pathname === "/") {
      scrollToSectionLocal(sectionId);
      return;
    }

    // Otherwise navigate to home and pass the target section via location.state
    navigate("/", { state: { scrollTo: sectionId } });
  };

  const handleHomeClick = () => {
    setMenuOpen(false);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-luxuryLine/70 bg-white/78 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo/Home */}
        <button
          onClick={handleHomeClick}
          className="font-display text-xl tracking-wide text-left group"
          aria-label="Go to home"
        >
          <span className="text-[#8b7158] group-hover:text-luxuryInk transition-colors duration-300">A.</span> 
          <span className="text-luxuryInk group-hover:text-[#8b7158] transition-colors duration-300">Interiors</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 text-sm items-center">
          <button
            onClick={handleHomeClick}
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
          >
            Home
          </button>

          <button 
            onClick={() => handleNavClick("categories")} 
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
          >
            Categories
          </button>
          
          <NavLink 
            to="/projects" 
            className={({ isActive }) => 
              isActive 
                ? "text-[#8b7158] relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-px after:bg-[#8b7158]" 
                : "text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
            }
          >
            Projects
          </NavLink>

          <button 
            onClick={() => handleNavClick("about")} 
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
          >
            About
          </button>
          
          <button 
            onClick={() => handleNavClick("contact")} 
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
          >
            Contact
          </button>
        </nav>

        {/* CV (desktop) */}
        <a
          href={cvHref}
          className="hidden md:inline rounded-full border border-luxuryLine bg-white/55 px-3 py-1.5 text-sm text-luxuryInk hover:border-[#b89b7d] hover:bg-white transition-all duration-300"
          download
        >
          Download CV
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-2xl text-luxuryInk hover:text-[#8b7158] transition-colors duration-300"
          onClick={() => setMenuOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile menu - smooth slide / fade */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${
          menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        } border-t border-luxuryLine/70 bg-white/92 backdrop-blur-md`}
      >
        <nav className="flex flex-col items-center py-4 gap-4">
          <button
            onClick={() => {
              // Home logic for mobile
              setMenuOpen(false);
              handleHomeClick();
            }}
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
          >
            Home
          </button>

          <NavLink 
            to="/projects" 
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300" 
            onClick={() => setMenuOpen(false)}
          >
            Projects
          </NavLink>

          <button 
            onClick={() => handleNavClick("categories")} 
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
          >
            Categories
          </button>
          
          <button 
            onClick={() => handleNavClick("about")} 
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
          >
            About
          </button>
          
          <button 
            onClick={() => handleNavClick("contact")} 
            className="text-luxuryMuted hover:text-luxuryInk transition-colors duration-300"
          >
            Contact
          </button>

          <a
            href={cvHref}
            className="rounded-full border border-luxuryLine bg-white/55 px-3 py-1.5 text-sm text-luxuryInk hover:border-[#b89b7d] hover:bg-white transition-all duration-500"
            download
            onClick={() => setMenuOpen(false)}
          >
            Download CV
          </a>
        </nav>
      </div>
    </header>
  );
}
