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
import CategoryStepRouter from "./CategoryStepRouter";
import PostAdView from "./PostAdView";
import ChatPage from "./ChatPage";
import Wishlist from "./Wishlist";
import Merchandise from "./Merchandise";
import SellHub from "./SellHub";
import MerchandiseForm from "./forms/MerchandiseForm";
import ComedyForm from "./forms/ComedyForm";
import EventForm from "./forms/EventForm";
import ConcertForm from "./forms/ConcertForm";
import MyTickets from "./MyTickets";
import AdminRoute from "./AdminRoute";

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
        <Route path="/chat/:auctionId" element={<ChatPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/merchandise" element={<Merchandise />} />
        <Route path="/sell-hub" element={<AdminRoute><SellHub /></AdminRoute>} />
        <Route path="/sell/merchandise" element={<AdminRoute><MerchandiseForm /></AdminRoute>} />
        <Route path="/sell/comedy" element={<AdminRoute><ComedyForm /></AdminRoute>} />
        <Route path="/sell/event" element={<AdminRoute><EventForm /></AdminRoute>} />
        <Route path="/sell/concert" element={<AdminRoute><ConcertForm /></AdminRoute>} />
        <Route path="/tickets" element={<MyTickets />} />
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/category/:categoryId" element={<SubcategoryList />} />
        <Route path="/category/:categoryId/:subcategoryId" element={<CategoryStepRouter />} />
        <Route path="/category/:categoryId/:subcategoryId/:nestedSubcategoryId" element={<PostAdView />} />
      </Routes>
    </Router>
  );
}

export default App;
