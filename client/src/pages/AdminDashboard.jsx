// client/src/pages/AdminDashboard.jsx
import { useCallback, useEffect, useState } from "react";
import { SignOutButton } from "@clerk/clerk-react";
import { getAuthToken } from "../utils/authToken.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "https://interior-portfolio-production-4108.up.railway.app/api";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ id: null, name: "", cover: null, existingCover: null });
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState({
    id: null,
    title: "",
    description: "",
    category_id: "",
    images: [],
    existingImages: [],
  });

  // Helper function
  const toUrl = useCallback((p) => {
    if (!p) return null;
    return p.startsWith("http") ? p : `https://interior-portfolio-production-4108.up.railway.app${p}`;
  }, []);

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      const normalized = data.map(c => ({
        ...c,
        cover_image: c.cover_image ? c.cover_image : null
      }));
      setCategories(normalized);
    } catch (err) {
      console.error("fetchCategories err", err);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();

      const normalized = data.map(p => {
        const imgs = Array.isArray(p.images)
          ? p.images.map(img => {
              if (!img) return null;
              if (typeof img === "string") {
                return { id: null, path: toUrl(img) };
              } else {
                const id = img.id ?? img.image_id ?? null;
                const path = img.path ?? img.image_path ?? null;
                return { id, path: toUrl(path) };
              }
            }).filter(Boolean)
          : [];

        return {
          ...p,
          images: imgs
        };
      });

      setProjects(normalized);
    } catch (err) {
      console.error("fetchProjects err", err);
    }
  }, [toUrl]);

  const adminFetch = useCallback(async (url, options = {}) => {
    const token = await getAuthToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProjects();
  }, [fetchCategories, fetchProjects]);

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", categoryForm.name);
      if (categoryForm.cover) formData.append("cover", categoryForm.cover);

      const url = categoryForm.id
        ? `${API_BASE}/admin/categories/${categoryForm.id}`
        : `${API_BASE}/admin/categories`;

      const method = categoryForm.id ? "PUT" : "POST";

      const res = await adminFetch(url, { method, body: formData });
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'failed'}));
        throw new Error(err.error || "Failed to save category");
      }

      setCategoryForm({ id: null, name: "", cover: null, existingCover: null });
      await fetchCategories();
      alert("Category saved");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (c) => {
    setCategoryForm({ id: c.id, name: c.name, cover: null, existingCover: c.cover_image ? c.cover_image : null });
    setActiveTab("categories");
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    setLoading(true);
    try {
      await adminFetch(`${API_BASE}/admin/categories/${id}`, { method: "DELETE" });
      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  // Project handlers
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", projectForm.title);
      formData.append("description", projectForm.description);
      formData.append("category_id", projectForm.category_id);

      if (projectForm.existingImages && projectForm.existingImages.length > 0) {
        projectForm.existingImages.forEach(img => {
          if (img.id) formData.append("existingImages", img.id);
        });
      }

      if (projectForm.images && projectForm.images.length > 0) {
        Array.from(projectForm.images).forEach(file => formData.append("images", file));
      }

      const url = projectForm.id
        ? `${API_BASE}/admin/projects/${projectForm.id}`
        : `${API_BASE}/admin/projects`;
      const method = projectForm.id ? "PUT" : "POST";

      const res = await adminFetch(url, { method, body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "failed" }));
        throw new Error(err.error || "Failed to save project");
      }

      setProjectForm({ id: null, title: "", description: "", category_id: "", images: [], existingImages: [] });
      await fetchProjects();
      alert("Project saved");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (p) => {
    const existing = Array.isArray(p.images) ? p.images.map(img => ({ id: img.id ?? null, path: img.path ?? toUrl(img.path) })) : [];
    setProjectForm({
      id: p.id,
      title: p.title || "",
      description: p.description || "",
      category_id: p.category_id || "",
      images: [],
      existingImages: existing,
    });
    setActiveTab("projects");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    setLoading(true);
    try {
      await adminFetch(`${API_BASE}/admin/projects/${id}`, { method: "DELETE" });
      await fetchProjects();
    } catch (err) {
      console.error(err);
      alert("Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const removeExistingProjectImage = async (img, projectId = projectForm.id) => {
    if (!window.confirm("Delete this image?")) return;
    setLoading(true);
    try {
      if (img.id) {
        const res = await adminFetch(`${API_BASE}/admin/projects/image/${img.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Server failed to delete image");
      }

      setProjectForm(prev => ({
        ...prev,
        existingImages: prev.existingImages.filter(i => {
          if (i.id && img.id) return i.id !== img.id;
          return i.path !== img.path;
        })
      }));

      setProjects(prev =>
        prev.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            images: (p.images || []).filter(ip => {
              if (!ip) return false;
              if (typeof ip === "string") return toUrl(ip) !== toUrl(img.path);
              if (typeof ip === "object") return (ip.id ?? null) !== (img.id ?? null);
              return true;
            })
          };
        })
      );
    } catch (err) {
      console.error("removeExistingProjectImage error:", err);
      alert("Failed to delete image");
    } finally {
      setLoading(false);
    }
  };

  const onCategoryFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setCategoryForm(prev => ({ ...prev, cover: file }));
  };

  const onProjectFilesChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setProjectForm(prev => ({ ...prev, images: files }));
  };

  const firstImagePath = (p) => {
    if (!p) return null;
    if (!p.images || p.images.length === 0) return null;
    const first = p.images[0];
    if (!first) return null;
    if (typeof first === "string") return toUrl(first);
    if (typeof first === "object") return first.path ?? toUrl(first);
    return null;
  };

  return (
    <div className="flex min-h-screen bg-luxuryBg text-white">
      <aside className="w-60 bg-luxurySurface p-6 flex flex-col gap-4">
        <button onClick={() => setActiveTab("home")} className={`py-2 px-4 rounded-lg ${activeTab==="home" ? "bg-luxuryGold text-black" : ""}`}>Home</button>
        <button onClick={() => setActiveTab("categories")} className={`py-2 px-4 rounded-lg ${activeTab==="categories" ? "bg-luxuryGold text-black" : ""}`}>Categories</button>
        <button onClick={() => setActiveTab("projects")} className={`py-2 px-4 rounded-lg ${activeTab==="projects" ? "bg-luxuryGold text-black" : ""}`}>Projects</button>
        <SignOutButton>
          <button className="mt-auto py-2 px-4 rounded-lg border border-luxuryLine text-luxuryMuted hover:text-white transition">
            Sign out
          </button>
        </SignOutButton>
      </aside>

      <main className="flex-1 p-8 overflow-auto text-luxuryInk">
        {activeTab === "home" && (
          <div className="text-center mt-20">
            <h1 className="text-4xl font-bold mb-4 text-luxuryInk">Welcome Admin!</h1>
            <p className="text-lg text-luxuryMuted">Use the buttons on the left to manage Categories and Projects.</p>
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-luxuryInk">Categories</h2>
            <form onSubmit={handleCategorySubmit} className="mb-6 flex flex-col gap-3">
              <input type="text" value={categoryForm.name} onChange={e=>setCategoryForm({...categoryForm, name:e.target.value})} placeholder="Category Name" className="px-4 py-2 rounded-lg bg-white border border-luxuryLine text-luxuryInk placeholder:text-luxuryMuted"/>
              {categoryForm.existingCover && !categoryForm.cover && (
                <img src={toUrl(categoryForm.existingCover)} alt="cover" className="w-48 h-32 object-cover rounded-lg"/>
              )}
              <input type="file" accept="image/*" onChange={onCategoryFileChange} className="text-luxuryInk"/>
              {categoryForm.cover && <img src={URL.createObjectURL(categoryForm.cover)} alt="preview" className="w-48 h-32 object-cover rounded-lg"/>}
              <button className="bg-luxuryGold text-black px-4 py-2 rounded-lg">{categoryForm.id ? "Save Category" : "Add Category"}</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map(c => (
                <div key={c.id} className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 text-white">
                  {c.cover_image && <img src={toUrl(c.cover_image)} alt={c.name} className="w-full h-32 object-cover"/>}
                  <div className="p-4 flex justify-between items-center">
                    <span>{c.name}</span>
                    <div className="flex gap-2">
                      <button onClick={()=>handleEditCategory(c)} className="bg-blue-600 px-2 py-1 rounded-lg text-sm">Edit</button>
                      <button onClick={()=>handleDeleteCategory(c.id)} className="bg-red-600 px-2 py-1 rounded-lg text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-luxuryInk">Projects</h2>
            <form onSubmit={handleProjectSubmit} className="mb-6 flex flex-col gap-3">
              <input type="text" value={projectForm.title} onChange={e=>setProjectForm({...projectForm, title:e.target.value})} placeholder="Project Title" className="px-4 py-2 rounded-lg bg-white border border-luxuryLine text-luxuryInk placeholder:text-luxuryMuted"/>
              <textarea value={projectForm.description} onChange={e=>setProjectForm({...projectForm, description:e.target.value})} placeholder="Project Description" className="px-4 py-2 rounded-lg bg-white border border-luxuryLine text-luxuryInk placeholder:text-luxuryMuted"/>
              <select value={projectForm.category_id} onChange={e=>setProjectForm({...projectForm, category_id:e.target.value})} className="px-4 py-2 rounded-lg bg-white border border-luxuryLine text-luxuryInk placeholder:text-luxuryMuted">
                <option value="">Select Category</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {projectForm.existingImages.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {projectForm.existingImages.map((img) => (
                    <div key={img.id ?? img.path} className="relative">
                      <img src={img.path} alt="project" className="w-20 h-20 object-cover rounded-lg"/>
                      <button type="button" onClick={()=>removeExistingProjectImage(img)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" accept="image/*" multiple onChange={onProjectFilesChange} className="text-luxuryInk"/>
              {projectForm.images && projectForm.images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {Array.from(projectForm.images).map((f, i) => (
                    <img key={i} src={URL.createObjectURL(f)} alt={`new-${i}`} className="w-20 h-20 object-cover rounded-lg" />
                  ))}
                </div>
              )}
              <button className="bg-luxuryGold text-black px-4 py-2 rounded-lg">{projectForm.id ? "Save Project" : "Add Project"}</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => (
                <div key={p.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 text-white">
                  {firstImagePath(p) && <img src={firstImagePath(p)} alt={p.title} className="w-full h-48 object-cover"/>}
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <h3>{p.title}</h3>
                      <p className="text-white/60">{p.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditProject(p)} className="bg-blue-600 px-2 py-1 rounded-lg text-sm">Edit</button>
                      <button onClick={() => handleDeleteProject(p.id)} className="bg-red-600 px-2 py-1 rounded-lg text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-luxuryGold border-solid"></div>
          <span className="ml-4 text-luxuryGold text-xl font-semibold">Processing...</span>
        </div>
      )}
    </div>
  );
}
