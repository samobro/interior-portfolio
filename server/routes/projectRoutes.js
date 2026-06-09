const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { upload, uploadToCloudinary, deleteFromCloudinary, uploadMultipleToCloudinary } = require("../middleware/cloudinaryUpload");
const { cache } = require('../server'); // ADD THIS
const { requireAdmin } = require("../middleware/clerkAuth");

// Helper function to extract Cloudinary public ID from URL
const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return `interior-portfolio/${filename.split('.')[0]}`;
};

router.get("/", async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('Fetching all projects...');
    
    // Check cache first
    const cached = await cache.getCache('projects');
    if (cached) {
      console.log('⚡ Cache hit - projects');
      return res.json(cached);
    }
    
    const query = `
      SELECT p.id AS project_id, p.title, p.description, p.category_id, c.name AS category,
             i.id AS image_id, i.image_path
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN project_images i ON p.id = i.project_id
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query);
    const rows = result.rows;

    const projects = {};
    rows.forEach(row => {
      if (!projects[row.project_id]) {
        projects[row.project_id] = {
          id: row.project_id,
          title: row.title,
          description: row.description,
          category_id: row.category_id,
          category: row.category,
          images: [],
        };
      }
      if (row.image_path) {
        projects[row.project_id].images.push({
          id: row.image_id,
          path: row.image_path,
        });
      }
    });

    const projectsArray = Object.values(projects);

    const queryTime = Date.now() - startTime;
    console.log(`Projects fetched in ${queryTime}ms. Found: ${projectsArray.length} projects`);
    
    // Cache forever
    await cache.setCache('projects', projectsArray);
    
    res.json(projectsArray);
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`Error fetching projects after ${errorTime}ms:`, err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ===== GET all projects with category + images =====
router.get("/", async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('Fetching all projects...');
    
    const query = `
      SELECT p.id AS project_id, p.title, p.description, p.category_id, c.name AS category,
             i.id AS image_id, i.image_path
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN project_images i ON p.id = i.project_id
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query);
    const rows = result.rows;

    const projects = {};
    rows.forEach(row => {
      if (!projects[row.project_id]) {
        projects[row.project_id] = {
          id: row.project_id,
          title: row.title,
          description: row.description,
          category_id: row.category_id,
          category: row.category,
          images: [],
        };
      }
      if (row.image_path) {
        projects[row.project_id].images.push({
          id: row.image_id,
          path: row.image_path, // Now this will be Cloudinary URL
        });
      }
    });

    const queryTime = Date.now() - startTime;
    console.log(`Projects fetched in ${queryTime}ms. Found: ${Object.keys(projects).length} projects`);
    
    res.json(Object.values(projects));
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`Error fetching projects after ${errorTime}ms:`, err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ===== GET projects by category =====
router.get("/category/:id", async (req, res) => {
  const startTime = Date.now();
  try {
    console.log(`Fetching projects for category: ${req.params.id}`);
    
    const query = `
      SELECT p.id AS project_id, p.title, p.description, p.category_id, c.name AS category,
             i.id AS image_id, i.image_path
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN project_images i ON p.id = i.project_id
      WHERE p.category_id = $1
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, [req.params.id]);
    const rows = result.rows;

    const projects = {};
    rows.forEach(row => {
      if (!projects[row.project_id]) {
        projects[row.project_id] = {
          id: row.project_id,
          title: row.title,
          description: row.description,
          category_id: row.category_id,
          category: row.category,
          images: [],
        };
      }
      if (row.image_path) {
        projects[row.project_id].images.push({
          id: row.image_id,
          path: row.image_path,
        });
      }
    });

    const queryTime = Date.now() - startTime;
    console.log(`Category projects fetched in ${queryTime}ms. Found: ${Object.keys(projects).length} projects`);

    res.json(Object.values(projects));
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`Error fetching projects by category after ${errorTime}ms:`, err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ===== OPTIMIZED: ADD PROJECT with Cloudinary =====
router.post("/", requireAdmin, upload.array("images", 10), async (req, res) => {
  const startTime = Date.now();
  try {
    const { title, description, category_id } = req.body;
    
    console.log(`Creating new project: "${title}" with ${req.files?.length || 0} images`);
    
    if (!title || !description || !category_id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate file sizes
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ error: `Image ${file.originalname} is too large. Max 5MB allowed.` });
        }
      }
    }

    // Insert project first
    const projectQuery = `
      INSERT INTO projects (title, description, category_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `;
    const projectResult = await pool.query(projectQuery, [title, description, category_id]);
    const projectId = projectResult.rows[0].id;

    console.log(`Project created with ID: ${projectId}`);

    const uploadedImages = [];

    // Use batch upload for better performance if multiple images
    if (req.files && req.files.length > 0) {
      if (req.files.length === 1) {
        // Single image upload
        try {
          const cloudinaryResult = await uploadToCloudinary(req.files[0].buffer, 'interior-portfolio/projects');
          
          const imageQuery = `INSERT INTO project_images (project_id, image_path) VALUES ($1, $2) RETURNING id`;
          const imageResult = await pool.query(imageQuery, [projectId, cloudinaryResult.secure_url]);
          
          uploadedImages.push({
            id: imageResult.rows[0].id,
            path: cloudinaryResult.secure_url,
          });
        } catch (uploadError) {
          console.error('Error uploading single image to Cloudinary:', uploadError.message);
          // Continue without image rather than failing completely
        }
      } else {
        // Multiple images - use parallel upload
        console.log(`Starting parallel upload of ${req.files.length} images...`);
        
        const uploadPromises = req.files.map(async (file, index) => {
          try {
            const cloudinaryResult = await uploadToCloudinary(file.buffer, 'interior-portfolio/projects');
            
            const imageQuery = `INSERT INTO project_images (project_id, image_path) VALUES ($1, $2) RETURNING id`;
            const imageResult = await pool.query(imageQuery, [projectId, cloudinaryResult.secure_url]);
            
            return {
              id: imageResult.rows[0].id,
              path: cloudinaryResult.secure_url,
            };
          } catch (uploadError) {
            console.error(`Error uploading image ${index} to Cloudinary:`, uploadError.message);
            return null; // Return null for failed uploads
          }
        });

        const results = await Promise.allSettled(uploadPromises);
        
        // Filter successful uploads
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            uploadedImages.push(result.value);
          }
        });

        console.log(`Parallel upload completed. Successful: ${uploadedImages.length}/${req.files.length}`);
      }
    }

    const newProject = {
      id: projectId,
      title,
      description,
      category_id: parseInt(category_id),
      images: uploadedImages,
    };

    const totalTime = Date.now() - startTime;
    console.log(`Project creation completed in ${totalTime}ms`);
    await cache.deleteCache('projects'); // ADD THIS LINE

    res.status(201).json(newProject);
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`Error creating project after ${errorTime}ms:`, err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ===== GET single project by id =====
router.get("/:id", async (req, res) => {
  const startTime = Date.now();
  try {
    const projectId = req.params.id;
    console.log(`Fetching project: ${projectId}`);

    const query = `
      SELECT p.id AS project_id, p.title, p.description, p.category_id, c.name AS category,
             i.id AS image_id, i.image_path
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN project_images i ON p.id = i.project_id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [projectId]);
    const rows = result.rows;

    if (rows.length === 0) {
      const queryTime = Date.now() - startTime;
      console.log(`Project not found after ${queryTime}ms`);
      return res.status(404).json({ error: "Project not found" });
    }

    const project = { images: [] };
    rows.forEach(row => {
      project.id = row.project_id;
      project.title = row.title;
      project.description = row.description;
      project.category_id = row.category_id;
      project.category = row.category;
      if (row.image_path) {
        project.images.push({
          id: row.image_id,
          path: row.image_path,
        });
      }
    });

    const queryTime = Date.now() - startTime;
    console.log(`Project fetched in ${queryTime}ms`);

    res.json(project);
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`Error fetching project after ${errorTime}ms:`, err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ===== OPTIMIZED: UPDATE PROJECT =====
router.put("/:id", requireAdmin, upload.array("images", 10), async (req, res) => {
  const startTime = Date.now();
  try {
    const projectId = req.params.id;
    const { title, description, category_id } = req.body;

    console.log(`Updating project: ${projectId} with ${req.files?.length || 0} new images`);

    if (!title || !description || !category_id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate file sizes
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ error: `Image ${file.originalname} is too large. Max 5MB allowed.` });
        }
      }
    }

    // Update project details
    const updateQuery = `UPDATE projects SET title=$1, description=$2, category_id=$3 WHERE id=$4`;
    const updateResult = await pool.query(updateQuery, [title, description, category_id, projectId]);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    console.log('Project details updated successfully');

    // Upload new images if any (using parallel processing)
    if (req.files && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} new images...`);
      
      const uploadPromises = req.files.map(async (file, index) => {
        try {
          const cloudinaryResult = await uploadToCloudinary(file.buffer, 'interior-portfolio/projects');
          
          const imageQuery = `INSERT INTO project_images (project_id, image_path) VALUES ($1, $2)`;
          await pool.query(imageQuery, [projectId, cloudinaryResult.secure_url]);
          
          console.log(`Image ${index + 1} uploaded successfully`);
        } catch (uploadError) {
          console.error(`Error uploading image ${index}:`, uploadError.message);
        }
      });

      await Promise.allSettled(uploadPromises);
    }

    // Return updated project
    const query = `
      SELECT p.id AS project_id, p.title, p.description, p.category_id, c.name AS category, 
             i.id AS image_id, i.image_path
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN project_images i ON p.id = i.project_id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [projectId]);
    const rows = result.rows;

    const project = { images: [] };
    rows.forEach(row => {
      project.id = row.project_id;
      project.title = row.title;
      project.description = row.description;
      project.category_id = row.category_id;
      project.category = row.category;
      if (row.image_path) {
        project.images.push({
          id: row.image_id,
          path: row.image_path,
        });
      }
    });

    const totalTime = Date.now() - startTime;
    console.log(`Project update completed in ${totalTime}ms`);
    await cache.deleteCache('projects'); // ADD THIS LINE

    res.json(project);
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`Error updating project after ${errorTime}ms:`, err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ===== OPTIMIZED: DELETE PROJECT =====
router.delete("/:id", requireAdmin, async (req, res) => {
  const startTime = Date.now();
  try {
    const projectId = req.params.id;
    console.log(`Deleting project: ${projectId}`);

    // Get all image URLs for this project
    const imageResult = await pool.query("SELECT image_path FROM project_images WHERE project_id=$1", [projectId]);
    
    console.log(`Found ${imageResult.rows.length} images to delete from Cloudinary`);

    // Delete images from Cloudinary in parallel
    const deletePromises = imageResult.rows.map(async (row, index) => {
      if (row.image_path && row.image_path.includes('cloudinary.com')) {
        try {
          const publicId = getPublicIdFromUrl(row.image_path);
          await deleteFromCloudinary(publicId);
          console.log(`Image ${index + 1} deleted from Cloudinary`);
        } catch (deleteError) {
          console.error(`Error deleting image ${index} from Cloudinary:`, deleteError.message);
        }
      }
    });

    await Promise.allSettled(deletePromises);

    // Delete from database
    await pool.query("DELETE FROM project_images WHERE project_id=$1", [projectId]);
    const deleteResult = await pool.query("DELETE FROM projects WHERE id=$1 RETURNING *", [projectId]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const totalTime = Date.now() - startTime;
    console.log(`Project deletion completed in ${totalTime}ms`);
    await cache.deleteCache('projects'); // ADD THIS LINE

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`Error deleting project after ${errorTime}ms:`, err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ===== OPTIMIZED: DELETE single image =====
router.delete("/image/:id", requireAdmin, async (req, res) => {
  const startTime = Date.now();
  try {
    const imageId = req.params.id;
    console.log(`Deleting image: ${imageId}`);

    // Get image URL
    const result = await pool.query("SELECT image_path FROM project_images WHERE id = $1", [imageId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const imageUrl = result.rows[0].image_path;

    // Delete from Cloudinary if it's a Cloudinary URL
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      try {
        const publicId = getPublicIdFromUrl(imageUrl);
        await deleteFromCloudinary(publicId);
        console.log('Image deleted from Cloudinary successfully');
      } catch (deleteError) {
        console.error('Error deleting from Cloudinary:', deleteError.message);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    const deleteResult = await pool.query("DELETE FROM project_images WHERE id = $1 RETURNING *", [imageId]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "Image not found in database" });
    }

    const totalTime = Date.now() - startTime;
    console.log(`Image deletion completed in ${totalTime}ms`);

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error(`Error deleting image after ${errorTime}ms:`, err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

module.exports = router;