import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Components/Home/Home";
import Login from "./Components/Login/Login"; // our new Login
import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import RoleRoute from "./Components/Auth/RoleRoute";
import AdminDashboard from "./Components/Dashboards/AdminDashboard";
import AgentDashboard from "./Components/Dashboards/AgentDashboard";
import CustomerDashboard from "./Components/Dashboards/CustomerDashboard";
import { AuthProvider } from "./contexts/auth-context";
import Signup from "./Components/Signup/Signup";
import Cars from "./Components/Cars/Cars"; // <-- add this line
import About from "./Components/About/About";  // 
import Contact from "./Components/Contact/Contact";

console.log({
  Navbar,
  Home,
  Login,
  Signup,
  ProtectedRoute,
  RoleRoute,
  AdminDashboard,
  AgentDashboard,
  CustomerDashboard
});

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cars" element={<Cars />} />   
          <Route path="/about" element={<About />} />  {/* <-- added */}
          <Route path="/contact" element={<Contact />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allow={["Admin"]} />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
            </Route>
            <Route element={<RoleRoute allow={["RentalAgent"]} />}>
              <Route path="/dashboard/agent" element={<AgentDashboard />} />
            </Route>
            <Route element={<RoleRoute allow={["Customer","Admin","RentalAgent"]} />}>
              <Route path="/dashboard/customer" element={<CustomerDashboard />} />
            </Route>
          </Route>

          {/* stubs */}
          <Route path="*" element={<div className="container py-5">Not found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
