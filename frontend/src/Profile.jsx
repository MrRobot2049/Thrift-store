import React, { useEffect, useState } from "react";
import NavBar from "./NavBar";
import { Link } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProfile();
  }, [token]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!profile) return <p>Loading profile...</p>;

  const itemsListed = profile.itemsListed || [];
  const auctionsCreated = profile.auctionsCreated || [];
  const wonAuctions = profile.wonAuctions || [];
  const bidHistory = profile.bidHistory || [];

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <NavBar />
      <h2>My Profile</h2>
      {profile.user && (
        <div style={{ backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <p><strong>Name:</strong> {profile.user.name}</p>
          <p><strong>Email:</strong> {profile.user.email}</p>
        </div>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h3>My Listed Items ({itemsListed.length})</h3>
        {itemsListed.length === 0 ? (
          <p>No items for sale yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {itemsListed.map((it) => (
              <li key={it._id} style={{ marginBottom: "0.5rem", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px" }}>
                <Link to={`/items/${it._id}`} style={{ textDecoration: "none", color: "#667eea" }}>
                  {it.title}
                </Link>
                <span style={{ marginLeft: "1rem", color: "#999" }}>Status: {it.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3>Auctions I Created ({auctionsCreated.length})</h3>
        {auctionsCreated.length === 0 ? (
          <p>No auctions created yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {auctionsCreated.map((au) => (
              <li key={au._id} style={{ marginBottom: "0.5rem", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px" }}>
                <Link to={`/auctions/${au._id}`} style={{ textDecoration: "none", color: "#667eea" }}>
                  {au.item?.title}
                </Link>
                <span style={{ marginLeft: "1rem", color: "#999" }}>
                  Current bid: ₹{au.currentHighestBid} | 
                  {au.isActive ? " 🔴 LIVE" : " ⚫ ENDED"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3>Auctions I Won ({wonAuctions.length})</h3>
        {wonAuctions.length === 0 ? (
          <p>No winning auctions yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {wonAuctions.map((au) => (
              <li key={au._id} style={{ marginBottom: "0.5rem", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "#e8f5e9" }}>
                <Link to={`/auctions/${au._id}`} style={{ textDecoration: "none", color: "#2e7d32" }}>
                  {au.item?.title}
                </Link>
                <span style={{ marginLeft: "1rem", color: "#2e7d32" }}>
                  🏆 Won for ₹{au.soldPrice}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>My Bids ({bidHistory.length})</h3>
        {bidHistory.length === 0 ? (
          <p>No bids placed yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {bidHistory.map((bid) => (
              <li key={bid._id} style={{ marginBottom: "0.5rem", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px" }}>
                <Link to={`/auctions/${bid.auction?._id}`} style={{ textDecoration: "none", color: "#667eea" }}>
                  {bid.auction?.item?.title}
                </Link>
                <span style={{ marginLeft: "1rem", color: "#999" }}>
                  Bid: ₹{bid.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}