const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { getCategories, getCategoryById } = require("../controllers/categoryController");
const { upload, uploadToCloudinary, deleteFromCloudinary } = require("../middleware/cloudinaryUpload");
const { cache } = require('../server');
const { requireAdmin } = require("../middleware/clerkAuth");

// Helper function to extract Cloudinary public ID from URL
const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return `interior-portfolio/categories/${filename.split('.')[0]}`;
};

// GET all categories
router.get("/", getCategories);

// GET single category by ID
router.get("/:id", getCategoryById);

// POST add category with optional cover image
router.post("/", requireAdmin, upload.single("cover"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name required" });

    let coverUrl = null;

    // Upload cover image to Cloudinary if provided
    if (req.file) {
      try {
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'interior-portfolio/categories');
        coverUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading category cover to Cloudinary:', uploadError);
        return res.status(500).json({ error: "Image upload failed" });
      }
    }

    const query = "INSERT INTO categories (name, cover_image) VALUES ($1, $2) RETURNING id";
    const result = await pool.query(query, [name, coverUrl]);
    await cache.deleteCache('categories'); 

    res.status(201).json({ 
      id: result.rows[0].id, 
      name, 
      cover_image: coverUrl 
    });
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: "Database error" });
  }
});



// ===== UPDATE CATEGORY =====
router.put("/:id", requireAdmin, upload.single("cover"), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name required" });

    // Get current category data
    const currentResult = await pool.query("SELECT cover_image FROM categories WHERE id = $1", [categoryId]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    let newCoverUrl = currentResult.rows[0].cover_image; // Keep existing if no new image

    // If new cover image is uploaded
    if (req.file) {
      try {
        // Upload new image to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'interior-portfolio/categories');
        newCoverUrl = cloudinaryResult.secure_url;

        // Delete old image from Cloudinary if it exists
        const oldCoverUrl = currentResult.rows[0].cover_image;
        if (oldCoverUrl && oldCoverUrl.includes('cloudinary.com')) {
          try {
            const publicId = getPublicIdFromUrl(oldCoverUrl);
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Error deleting old category image from Cloudinary:', deleteError);
          }
        }
      } catch (uploadError) {
        console.error('Error uploading new category cover to Cloudinary:', uploadError);
        return res.status(500).json({ error: "Image upload failed" });
      }
    }

    // Update category in database
    const updateQuery = "UPDATE categories SET name = $1, cover_image = $2 WHERE id = $3";
    await pool.query(updateQuery, [name, newCoverUrl, categoryId]);
    await cache.deleteCache('categories'); // ADD THIS LINE

    res.json({ 
      id: parseInt(categoryId), 
      name, 
      cover_image: newCoverUrl 
    });
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE category by ID
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Get category data to find cover image
    const result = await pool.query("SELECT cover_image FROM categories WHERE id = $1", [categoryId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const coverImageUrl = result.rows[0].cover_image;

    // Delete cover image from Cloudinary if it exists
    if (coverImageUrl && coverImageUrl.includes('cloudinary.com')) {
      try {
        const publicId = getPublicIdFromUrl(coverImageUrl);
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.error('Error deleting category image from Cloudinary:', deleteError);
      }
    }

    // Delete category from database
    await pool.query("DELETE FROM categories WHERE id = $1", [categoryId]);
    await cache.deleteCache('categories'); // ADD THIS LINE

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;