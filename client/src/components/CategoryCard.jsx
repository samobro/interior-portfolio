// client/src/components/CategoryCard.jsx
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";

const optimizeImageUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.includes("?") ? url : `${url}?w=800&q=auto&f=auto`;
};

const CategoryCard = ({ item }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  // helper: handle both relative and full URLs
  const toUrl = (p) => {
    if (!p) return null;
    const resolved = p.startsWith("http") ? p : `https://interior-portfolio-production.up.railway.app${p}`;
    return optimizeImageUrl(resolved);
  };

  return (
    <Link
      to={`/category/${item.id}`}
      ref={ref}
      className={`group relative min-w-[280px] flex-shrink-0 overflow-hidden rounded-[1.75rem] border border-luxuryLine bg-white/80 shadow-[0_18px_60px_rgba(121,99,77,0.08)] transition duration-700 ease-out sm:min-w-[340px] lg:min-w-[380px]
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(121,99,77,0.14)]`}
    >
      <div className="relative">
        <div
          className="aspect-[4/3] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: `url(${item.cover_image ? toUrl(item.cover_image) : "/placeholder.jpg"})`,
          }}
        />
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/80 px-4 py-2 backdrop-blur-sm">
        <p className="text-[0.6rem] uppercase tracking-widest text-luxuryMuted">Category</p>
        <h3 className="mt-1 font-display text-lg text-luxuryInk transition-colors duration-300 group-hover:text-[#8b7158]">
          {item.name}
        </h3>
      </div>
    </Link>
  );
};

export default CategoryCard;
