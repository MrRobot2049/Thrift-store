import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./login";
import RegisterPage from "./RegisterPage";
import Home from "./Home";
import UploadItem from "./UploadItem";
import ItemDetail from "./ItemDetail";
import AuctionDetail from "./AuctionDetail";
import Profile from "./Profile";
import SellerDashboard from "./SellerDashboard";
import CategoryList from "./CategoryList";
import SubcategoryList from "./SubcategoryList";
import PostAdView from "./PostAdView";

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
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/upload" element={<UploadItem />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/auctions/:id" element={<AuctionDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/category/:categoryId" element={<SubcategoryList />} />
        <Route path="/category/:categoryId/:subcategoryId" element={<PostAdView />} />
      </Routes>
    </Router>
  );
}

export default App;


