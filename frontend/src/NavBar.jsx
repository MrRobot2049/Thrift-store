import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { fetchWishlistSubscriptions, subscribeToWishlist } from "./wishlistStorage";
import "./navbar.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const NOTIFICATION_POLL_INTERVAL_MS = 30000;

export default function NavBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const token = localStorage.getItem("token");
  const unreadCount = notifications.filter((entry) => !entry.isRead).length;
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadSubscriptions = async () => {
      try {
        if (!token) {
          return;
        }

        const subscriptions = await fetchWishlistSubscriptions();
        if (isMounted) {
          setWishlistCount(subscriptions.length);
        }
      } catch (err) {
        // Ignore nav count fetch issues.
      }
    };

    loadSubscriptions();

    const unsubscribe = subscribeToWishlist((subscriptions) => {
      if (isMounted) {
        setWishlistCount(subscriptions.length);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        if (!token) {
          return;
        }

        const response = await fetch(`${API_BASE_URL}/notifications/me`, {
          credentials: "include",
          headers: { Authorization: token },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        // Ignore network errors for notification polling.
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const formatTimeAgo = (dateValue) => {
    const createdAtMs = new Date(dateValue || 0).getTime();
    const diffMinutes = Math.floor((Date.now() - createdAtMs) / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const toggleNotifications = () => {
    setIsNotificationOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        fetch(`${API_BASE_URL}/notifications/me/read-all`, {
          method: "PATCH",
          credentials: "include",
          headers: { Authorization: token },
        }).catch(() => null);

        setNotifications((current) =>
          current.map((entry) => ({
            ...entry,
            isRead: true,
          }))
        );
      }
      return nextOpen;
    });
  };

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
        {/* Logo - Metallic Box */}
        <Link to="/home" className="nav-logo metallic-button">
          🛍️ ThriftStore
        </Link>

        {/* Links */}
        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `nav-link metallic-button${isActive ? " nav-link-active-metallic" : ""}`
              }
            >
              Sell
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/seller-dashboard"
              className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}
            >
              My Auctions
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/wishlist"
              className={({ isActive }) =>
                `nav-link nav-wishlist-link${isActive ? " nav-link-active" : ""}`
              }
            >
              Wishlist
              {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}
            >
              Profile
            </NavLink>
          </li>
          {user?.name && (
            <li className="nav-item nav-user">
              Hi, {user.name.split(" ")[0]}
            </li>
          )}
          <li className="nav-item nav-notification" ref={notificationRef}>
            <button
              className={`notification-btn${isNotificationOpen ? " notification-btn-open" : ""}`}
              onClick={toggleNotifications}
              aria-label="Notifications"
              aria-expanded={isNotificationOpen}
              aria-haspopup="menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="notification-dropdown" role="menu" aria-label="Notifications">
                <p className="notification-heading">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="notification-empty">No notifications yet</p>
                ) : (
                  <ul className="notification-list">
                    {notifications.map((entry) => (
                      <li key={entry._id} className="notification-item">
                        <Link
                          to={
                            entry.auction?._id
                              ? `/chat/${entry.auction._id}`
                              : entry.item?._id
                              ? `/items/${entry.item._id}`
                              : "/profile"
                          }
                          className="notification-link"
                          onClick={() => setIsNotificationOpen(false)}
                        >
                          <span className="notification-title">{entry.message || "Notification"}</span>
                          <span className="notification-meta">
                            {entry.item?.title || "Auction update"} • {formatTimeAgo(entry.createdAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
          <li className="nav-item">
            <button className="nav-logout metallic-button" onClick={logout}>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
