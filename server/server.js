const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const redis = require('redis');



// Redis setup connection
console.log('🔌 Connecting to Redis...');
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect()
  .then(() => console.log('✅ Redis Connected'))
  .catch(err => {
    console.error('❌ Redis error:', err);
    console.log('⚠️ Running without cache');
  });

redisClient.on('error', (err) => console.log('Redis Error:', err));

// Cache helpers
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const setCache = async (key, data, ttl = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    console.log(`📦 Cached: ${key}`);
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    console.log(`🗑️ Cleared: ${key}`);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};
// Export cache functions
module.exports.cache = {
  getCache,
  setCache,
  deleteCache
};

// ---------------- REQUEST LOGGING MIDDLEWARE -----------------
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Middleware
app.use(express.json());

// CORS configuration - allow only your GitHub Pages origin
app.use(cors({
  origin: ['https://samemad.github.io', 'https://interior-portfolio-1ji.pages.dev' , 
    'http://localhost:5173',   // أضف هذا
  'http://localhost:4173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));



// Health check route with performance info
app.get("/", (req, res) => {
  res.json({ 
    message: "Interior Portfolio API is running!", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    status: 'OK'
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
const categoryRoutes = require("./routes/categoryRoutes");
const projectRoutes = require("./routes/projectRoutes");
const { requireAdmin } = require("./middleware/clerkAuth");

app.use("/api/categories", categoryRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", requireAdmin);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/projects", projectRoutes);

// ---------------- ERROR HANDLING MIDDLEWARE -----------------
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large! Max 5MB allowed.' });
  }
  
  if (error.message === 'Only JPEG, PNG, tif or WEBP images are allowed') {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ 
    error: 'Internal server error', 
    details: error.message 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});
