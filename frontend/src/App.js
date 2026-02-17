import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./login";
import RegisterPage from "./RegisterPage";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>Dashboard</h2>
      <p>Logged in as: {user?.email || "Unknown user"}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;


