import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar/Navbar";
import Home from "./Components/Home/Home";
import Login from "./Components/Login/Login";

import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import RoleRoute from "./Components/Auth/RoleRoute";

import AdminDashboard from "./Components/Dashboards/AdminDashboard";
import AgentDashboard from "./Components/Dashboards/AgentDashboard";
import CustomerDashboard from "./Components/Dashboards/CustomerDashboard";

const App = () => (
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* protected dashboards */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={["Admin"]} />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<RoleRoute allow={["RentalAgent"]} />}>
          <Route path="/dashboard/agent" element={<AgentDashboard />} />
        </Route>

        <Route element={<RoleRoute allow={["Customer", "Admin", "RentalAgent"]} />}>
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
        </Route>
      </Route>

      {/* optional stubs so links never 404 */}
      <Route path="/cars" element={<div className="container py-5">Cars</div>} />
      <Route path="/about" element={<div className="container py-5">About</div>} />
      <Route path="/contact" element={<div className="container py-5">Contact</div>} />
      <Route path="*" element={<div className="container py-5">Not found</div>} />
    </Routes>
  </BrowserRouter>
);

export default App;
