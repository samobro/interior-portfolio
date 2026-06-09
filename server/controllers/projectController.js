// server/controllers/projectController.js
const Project = require("../models/projectModel");

async function getProjects(req, res) {
  try {
    const projects = await Project.getAllProjects();
    res.json(projects);
  } catch (err) {
    console.error("Error in getProjects:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function addProject(req, res) {
  try {
    const { title, description, category_id } = req.body;
    if (!title || !description || !category_id) {
      return res.status(400).json({ error: "All fields required" });
    }

    const newProject = await Project.createProject(title, description, category_id);
    res.status(201).json(newProject);
  } catch (err) {
    console.error("Error in addProject:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ✅ ADD THIS MISSING METHOD
async function getProjectsByCategory(req, res) {
  try {
    const { id } = req.params;
    const projects = await Project.getProjectsByCategory(id);
    res.json(projects);
  } catch (err) {
    console.error("Error in getProjectsByCategory:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ===== ADD THESE TO projectController.js =====

async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(project);
  } catch (err) {
    console.error("Error in getProjectById:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { title, description, category_id } = req.body;
    
    console.log('Updating project:', id);
    
    if (!title || !description || !category_id) {
      return res.status(400).json({ error: "All fields required" });
    }

    const updatedProject = await Project.updateProject(id, title, description, category_id);
    
    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(updatedProject);
  } catch (err) {
    console.error("Error in updateProject:", err);
    res.status(500).json({ error: "Database error" });
  }
}

async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    
    console.log('Deleting project:', id);
    
    const deleted = await Project.deleteProject(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error in deleteProject:", err);
    res.status(500).json({ error: "Database error" });
  }
}

// Update your module.exports:
module.exports = { 
  getProjects, 
  addProject, 
  getProjectsByCategory, 
  getProjectById,
  updateProject,
  deleteProject 
};

