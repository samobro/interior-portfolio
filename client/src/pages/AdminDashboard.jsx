// client/src/pages/AdminDashboard.jsx
import { useCallback, useEffect, useState } from "react";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { FiFolder, FiGrid, FiImage, FiPlus, FiArrowRight } from "react-icons/fi";
import { getAuthToken } from "../utils/authToken.js";
import { ProgressBar } from "../components/admin/ProgressBar.jsx";
import { ConfirmDialog } from "../components/admin/ConfirmDialog.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "https://interior-portfolio-production-4108.up.railway.app/api";

export default function AdminDashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});
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

  const openConfirm = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => async () => {
      setConfirmOpen(false);
      await action();
    });
    setConfirmOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <ProgressBar isLoading={loading} />
      <aside className="w-60 bg-white p-6 flex flex-col gap-4 border-r border-gray-200">
        <button onClick={() => setActiveTab("home")} className={`py-2 px-4 rounded-lg ${activeTab==="home" ? "bg-luxuryGold text-black" : "text-gray-900 hover:bg-gray-100"}`}>Home</button>
        <button onClick={() => setActiveTab("categories")} className={`py-2 px-4 rounded-lg ${activeTab==="categories" ? "bg-luxuryGold text-black" : "text-gray-900 hover:bg-gray-100"}`}>Categories</button>
        <button onClick={() => setActiveTab("projects")} className={`py-2 px-4 rounded-lg ${activeTab==="projects" ? "bg-luxuryGold text-black" : "text-gray-900 hover:bg-gray-100"}`}>Projects</button>
        <SignOutButton>
          <button className="mt-auto py-2 px-4 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition">
            Sign out
          </button>
        </SignOutButton>
      </aside>

      <main className="flex-1 p-8 overflow-auto text-gray-900">
        {activeTab === "home" && (
          <div className="max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Good evening{user?.firstName ? `, ${user.firstName}` : ""}</h1>
                <p className="text-lg text-gray-500">Here's what's going on with your portfolio.</p>
              </div>
              <div className="flex gap-4 mt-6 md:mt-0">
                <button onClick={() => setActiveTab("categories")} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                  <FiPlus /> Add category
                </button>
                <button onClick={() => setActiveTab("projects")} className="flex items-center gap-2 bg-[#B47B3A] text-white px-4 py-2 rounded-lg hover:bg-[#a06a2f] transition">
                  <FiPlus /> Add project
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#F0E9E0] flex items-center justify-center text-[#B47B3A] text-2xl mr-4">
                  <FiFolder />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total projects</p>
                  <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#F0E9E0] flex items-center justify-center text-[#B47B3A] text-2xl mr-4">
                  <FiGrid />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total categories</p>
                  <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#F0E9E0] flex items-center justify-center text-[#B47B3A] text-2xl mr-4">
                  <FiImage />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total images</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {projects.reduce((sum, p) => sum + (p.images?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
                <button onClick={() => setActiveTab("projects")} className="text-[#B47B3A] hover:underline flex items-center gap-1 font-medium">
                  View all <FiArrowRight />
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {[...projects].reverse().slice(0, 3).map((p, index) => {
                    const category = categories.find(c => c.id === p.category_id);
                    return (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4">
                          {firstImagePath(p) ? (
                            <img src={firstImagePath(p)} alt={p.title} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200">
                              <FiImage size={24} />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                              {index === 0 && (
                                <span className="bg-[#F0E9E0] text-[#B47B3A] text-xs px-2 py-0.5 rounded-full font-medium">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {category ? category.name : "Uncategorized"} • {p.images?.length || 0} images
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {projects.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No projects found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Categories</h2>
            <form onSubmit={handleCategorySubmit} className="mb-6 flex flex-col gap-3">
              <input type="text" value={categoryForm.name} onChange={e=>setCategoryForm({...categoryForm, name:e.target.value})} placeholder="Category Name" className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500"/>
              {categoryForm.existingCover && !categoryForm.cover && (
                <img src={toUrl(categoryForm.existingCover)} alt="cover" className="w-48 h-32 object-cover rounded-lg"/>
              )}
              <input type="file" accept="image/*" onChange={onCategoryFileChange} className="text-gray-900"/>
              {categoryForm.cover && <img src={URL.createObjectURL(categoryForm.cover)} alt="preview" className="w-48 h-32 object-cover rounded-lg"/>}
              <button className="bg-luxuryGold text-black px-4 py-2 rounded-lg">{categoryForm.id ? "Save Category" : "Add Category"}</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map(c => (
                <div key={c.id} className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white text-gray-900 shadow-sm">
                  {c.cover_image && <img src={toUrl(c.cover_image)} alt={c.name} className="w-full h-32 object-cover"/>}
                  <div className="p-4 flex justify-between items-center">
                    <span>{c.name}</span>
                    <div className="flex gap-2">
                      <button onClick={()=>handleEditCategory(c)} className="bg-blue-600 px-2 py-1 rounded-lg text-sm">Edit</button>
                      <button onClick={()=>openConfirm("Delete this category?", () => handleDeleteCategory(c.id))} className="bg-red-600 px-2 py-1 rounded-lg text-sm text-white">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Projects</h2>
            <form onSubmit={handleProjectSubmit} className="mb-6 flex flex-col gap-3">
              <input type="text" value={projectForm.title} onChange={e=>setProjectForm({...projectForm, title:e.target.value})} placeholder="Project Title" className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500"/>
              <textarea value={projectForm.description} onChange={e=>setProjectForm({...projectForm, description:e.target.value})} placeholder="Project Description" className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500"/>
              <select value={projectForm.category_id} onChange={e=>setProjectForm({...projectForm, category_id:e.target.value})} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500">
                <option value="">Select Category</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {projectForm.existingImages.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {projectForm.existingImages.map((img) => (
                    <div key={img.id ?? img.path} className="relative">
                      <img src={img.path} alt="project" className="w-20 h-20 object-cover rounded-lg"/>
                      <button type="button" onClick={()=>openConfirm("Delete this image?", () => removeExistingProjectImage(img))} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" accept="image/*" multiple onChange={onProjectFilesChange} className="text-gray-900"/>
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
                <div key={p.id} className="rounded-2xl overflow-hidden border border-gray-200 bg-white text-gray-900 shadow-sm">
                  {firstImagePath(p) && <img src={firstImagePath(p)} alt={p.title} className="w-full h-48 object-cover"/>}
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <h3>{p.title}</h3>
                      <p className="text-gray-500">{p.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditProject(p)} className="bg-blue-600 px-2 py-1 rounded-lg text-sm">Edit</button>
                      <button onClick={() => openConfirm("Delete this project?", () => handleDeleteProject(p.id))} className="bg-red-600 px-2 py-1 rounded-lg text-sm text-white">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={confirmOpen}
        message={confirmMessage}
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
