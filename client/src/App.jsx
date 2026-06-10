import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Category from "./pages/Category.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SSOCallback from "./pages/SSOCallback.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-luxuryBg text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/category/:categoryId" element={<Category />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* Admin pages */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute component={AdminDashboard} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
