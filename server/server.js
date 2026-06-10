require("dotenv").config();

const cache = require('./config/cache');
module.exports.cache = cache;

const express = require("express");
const cors = require("cors");
const { clerkMiddleware } = require("@clerk/express");

const app = express();

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
const authRouter = require("./routes/auth");
const { requireAdmin } = require("./middleware/clerkAuth");
const { clerkProxyMiddleware, CLERK_PROXY_PATH } = require("./middleware/clerkProxyMiddleware");

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(clerkMiddleware());

app.use("/api/categories", categoryRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", authRouter);
app.use("/api/admin/categories", requireAdmin, categoryRoutes);
app.use("/api/admin/projects", requireAdmin, projectRoutes);

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
