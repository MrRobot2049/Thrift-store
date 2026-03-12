import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.5rem 1rem",
        borderBottom: "1px solid #ccc",
      }}
    >
      <div>
        <Link to="/home" style={{ marginRight: "1rem" }}>
          Home
        </Link>
        <Link to="/upload" style={{ marginRight: "1rem" }}>
          Sell Item
        </Link>
        <Link to="/seller-dashboard" style={{ marginRight: "1rem" }}>
          My Auctions
        </Link>
        <Link to="/profile">Profile</Link>
      </div>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}
