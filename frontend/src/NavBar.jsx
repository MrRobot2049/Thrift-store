import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";

export default function NavBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore network errors
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/home" className="nav-logo">
          🛍️ ThriftStore
        </Link>

        {/* Links */}
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/home" className="nav-link">
              Browse
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/categories" className="nav-link sell-btn">
              + Post Ad
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/seller-dashboard" className="nav-link">
              My Auctions
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
          </li>
          {user?.name && (
            <li className="nav-item nav-user">
              Hi, {user.name.split(" ")[0]}
            </li>
          )}
          <li className="nav-item">
            <button className="nav-logout" onClick={logout}>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
