// client/src/utils/api.js - OPTIMIZED VERSION WITH TIMEOUT HANDLING
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://interior-portfolio-production.up.railway.app/api';

export const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Interior', cover_image: null },
  { id: 2, name: 'Kitchen', cover_image: null },
  { id: 3, name: 'Living Room', cover_image: null },
  { id: 4, name: 'Bedroom', cover_image: null },
  { id: 5, name: 'Office', cover_image: null },
];

const fetchWithTimeout = async (url, options = {}, timeoutMs = 60000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw error;
  }
};

// ⚡ Enhanced error handling
const handleApiResponse = async (response, operation) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${operation} failed:`, response.status, errorText);
    throw new Error(`${operation} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// ✅ Get all categories (short timeout so the home page never appears stuck)
export async function fetchCategories() {
  console.log('🔄 Fetching categories...');
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/categories`, {}, 8000);
    const data = await handleApiResponse(res, 'Fetch categories');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Categories fetched in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to fetch categories after ${duration}ms:`, error.message);
    throw error;
  }
}

// ✅ Get single category (10 second timeout)
export async function fetchCategory(id) {
  console.log(`🔄 Fetching category: ${id}`);
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/categories/${id}`, {}, 30000);
    const data = await handleApiResponse(res, 'Fetch category');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Category fetched in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to fetch category after ${duration}ms:`, error.message);
    throw error;
  }
}

// ✅ Get projects by category (15 second timeout - might have images)
export async function fetchProjectsByCategory(id) {
  console.log(`🔄 Fetching projects for category: ${id}`);
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/projects/category/${id}`, {}, 15000);
    const data = await handleApiResponse(res, 'Fetch projects by category');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Projects by category fetched in ${duration}ms. Found: ${data.length} projects`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to fetch projects by category after ${duration}ms:`, error.message);
    throw error;
  }
}

// ✅ Get all projects (15 second timeout)
export async function fetchProjects() {
  console.log('🔄 Fetching all projects...');
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/projects`, {}, 15000);
    const data = await handleApiResponse(res, 'Fetch all projects');
    
    const duration = Date.now() - startTime;
    console.log(`✅ All projects fetched in ${duration}ms. Found: ${data.length} projects`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to fetch all projects after ${duration}ms:`, error.message);
    throw error;
  }
}

// ✅ Get single project (15 second timeout)
export async function fetchProject(id) {
  console.log(`🔄 Fetching project: ${id}`);
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/projects/${id}`, {}, 15000);
    const data = await handleApiResponse(res, 'Fetch project');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Project fetched in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to fetch project after ${duration}ms:`, error.message);
    throw error;
  }
}

// ⚡ OPTIMIZED: Create project with file upload (90 second timeout for uploads)
export async function createProject(formData) {
  console.log('🔄 Creating new project...');
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/projects`, {
      method: 'POST',
      body: formData, // Don't set Content-Type - let browser set it for multipart
    }, 90000); // 90 second timeout for uploads
    
    const data = await handleApiResponse(res, 'Create project');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Project created in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to create project after ${duration}ms:`, error.message);
    throw error;
  }
}

// ⚡ OPTIMIZED: Update project (90 second timeout for uploads)
export async function updateProject(id, formData) {
  console.log(`🔄 Updating project: ${id}`);
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      body: formData,
    }, 90000); // 90 second timeout for uploads
    
    const data = await handleApiResponse(res, 'Update project');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Project updated in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to update project after ${duration}ms:`, error.message);
    throw error;
  }
}

// ✅ Delete project (30 second timeout - might delete multiple images)
export async function deleteProject(id) {
  console.log(`🔄 Deleting project: ${id}`);
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    }, 30000);
    
    const data = await handleApiResponse(res, 'Delete project');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Project deleted in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to delete project after ${duration}ms:`, error.message);
    throw error;
  }
}

// ✅ Delete single image (15 second timeout)
export async function deleteImage(imageId) {
  console.log(`🔄 Deleting image: ${imageId}`);
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/projects/image/${imageId}`, {
      method: 'DELETE',
    }, 15000);
    
    const data = await handleApiResponse(res, 'Delete image');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Image deleted in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to delete image after ${duration}ms:`, error.message);
    throw error;
  }
}

// ⚡ CATEGORY MANAGEMENT FUNCTIONS
// ✅ Create category (60 second timeout for image upload)
export async function createCategory(formData) {
  console.log('🔄 Creating new category...');
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/categories`, {
      method: 'POST',
      body: formData,
    }, 60000);
    
    const data = await handleApiResponse(res, 'Create category');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Category created in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to create category after ${duration}ms:`, error.message);
    throw error;
  }
}

// ✅ Update category (60 second timeout)
export async function updateCategory(id, formData) {
  console.log(`🔄 Updating category: ${id}`);
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      body: formData,
    }, 60000);
    
    const data = await handleApiResponse(res, 'Update category');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Category updated in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to update category after ${duration}ms:`, error.message);
    throw error;
  }
}

// ✅ Delete category (15 second timeout)
export async function deleteCategory(id) {
  console.log(`🔄 Deleting category: ${id}`);
  const startTime = Date.now();
  
  try {
    const res = await fetchWithTimeout(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    }, 15000);
    
    const data = await handleApiResponse(res, 'Delete category');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Category deleted in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to delete category after ${duration}ms:`, error.message);
    throw error;
  }
}
