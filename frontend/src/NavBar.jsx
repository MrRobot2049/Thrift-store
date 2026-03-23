import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const NOTIFICATION_POLL_INTERVAL_MS = 30000;

export default function NavBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState(0);
  const notificationRef = useRef(null);

  const notificationStorageKey = `ts_notification_last_checked_${
    user?.id || "guest"
  }`;

  useEffect(() => {
    const storedLastCheckedAt = Number(localStorage.getItem(notificationStorageKey) || 0);
    setLastCheckedAt(storedLastCheckedAt);
  }, [notificationStorageKey]);

  useEffect(() => {
    let isMounted = true;

    const fetchNewItemNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/items`);
        if (!response.ok) {
          return;
        }

        const items = await response.json();
        const latestCreatedAt = items.reduce((latest, item) => {
          const createdAt = new Date(item.createdAt || 0).getTime();
          return createdAt > latest ? createdAt : latest;
        }, 0);

        if (!isMounted) {
          return;
        }

        // First run baseline: avoid flooding old items as notifications.
        if (!lastCheckedAt) {
          const baseline = latestCreatedAt || Date.now();
          localStorage.setItem(notificationStorageKey, String(baseline));
          setLastCheckedAt(baseline);
          return;
        }

        const newItems = items
          .filter((item) => {
            const createdAt = new Date(item.createdAt || 0).getTime();
            const isNewItem = createdAt > lastCheckedAt;
            const isOwnItem = item.seller?._id === user?.id;
            return isNewItem && !isOwnItem;
          })
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );

        if (newItems.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((item) => item._id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item._id));
            return [...uniqueNewItems, ...prev].slice(0, 20);
          });

          const newestTimestamp = new Date(newItems[0].createdAt || 0).getTime();
          localStorage.setItem(notificationStorageKey, String(newestTimestamp));
          setLastCheckedAt(newestTimestamp);
        }
      } catch (err) {
        // Ignore network errors for notification polling.
      }
    };

    fetchNewItemNotifications();
    const intervalId = setInterval(fetchNewItemNotifications, NOTIFICATION_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [lastCheckedAt, notificationStorageKey, user?.id]);

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
        setNotifications([]);
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
            <Link to="/categories" className="nav-link metallic-button">
              Sell
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
          <li className="nav-item nav-notification" ref={notificationRef}>
            <button
              className="notification-btn"
              onClick={toggleNotifications}
              aria-label="Notifications"
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
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="notification-dropdown">
                <p className="notification-heading">New Listings</p>
                {notifications.length === 0 ? (
                  <p className="notification-empty">No new notifications</p>
                ) : (
                  <ul className="notification-list">
                    {notifications.map((item) => (
                      <li key={item._id} className="notification-item">
                        <Link
                          to={`/items/${item._id}`}
                          className="notification-link"
                          onClick={() => setIsNotificationOpen(false)}
                        >
                          <span className="notification-title">{item.title || "New Item"}</span>
                          <span className="notification-meta">
                            ₹{item.askingPrice || "N/A"} • {formatTimeAgo(item.createdAt)}
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
