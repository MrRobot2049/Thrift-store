import React, { useEffect, useState } from "react";
import NavBar from "./NavBar";
import { Link } from "react-router-dom";
import "./profile.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("listed"); // 'listed' or 'auctions'
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          credentials: "include",
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

  if (error) return <p style={{ color: "red", padding: "2rem" }}>{error}</p>;
  if (!profile) return <p style={{ padding: "2rem" }}>Loading profile...</p>;

  const itemsListed = profile.itemsListed || [];
  const auctionsCreated = profile.auctionsCreated || [];
  const wonAuctions = profile.wonAuctions || [];
  const bidHistory = profile.bidHistory || [];

  // Helper to extract the primary image from an item
  const getImage = (item) => {
    if (item?.images && item.images.length > 0) return item.images[0];
    if (item?.image) return item.image;
    // Fallback grey placeholder if no image exists
    return "https://via.placeholder.com/400x400/222222/5c452e?text=No+Image"; 
  };

  // Helper to format date strings to: MM/DD-YYYY HH:mm:ss
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    
    return `${month}/${day}-${year} ${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="profile-page-wrapper">
      
      {/* Luminous Gallery contrasting header block */}
      <div className="luminous-header-backsplash">
        <NavBar />
        <div className="profile-container header-tight">
          <h1 className="profile-title">My Profile</h1>
        </div>
      </div>
      
      <div className="profile-container overlap-container">
        
        {profile.user && (
          <div className="profile-id-card">
            <div className="profile-avatar">
               <svg viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
               </svg>
            </div>
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Name: </span>
                <span className="info-value-name">{profile.user.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email: </span>
                <span className="info-value-email">{profile.user.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="profile-grid">
          
          {/* LEFT COLUMN */}
          <div className="left-section">
            <div className="tabs-header">
              <button 
                className={`tab-btn ${activeTab === 'listed' ? 'active' : ''}`}
                onClick={() => setActiveTab('listed')}
              >
                Listed Items ({itemsListed.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'auctions' ? 'active' : ''}`}
                onClick={() => setActiveTab('auctions')}
              >
                Auctions I Created ({auctionsCreated.length})
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'listed' ? (
                <div className="cards-grid">
                  {itemsListed.length === 0 ? <p style={{ color: '#888' }}>No items listed yet.</p> : null}
                  {itemsListed.map(it => (
                    <Link to={`/items/${it._id}`} key={it._id} className="item-card">
                      <div className="card-header">
                        <span className="card-title" title={it.title}>{it.title}</span>
                        <span className="badge badge-available">
                          {String(it.status).toLowerCase() === 'available' ? 'Available' : 'Sold'}
                        </span>
                      </div>
                      <div className="card-image-wrapper">
                        <img src={getImage(it)} alt={it.title} className="card-image" />
                      </div>
                      <div className="card-footer profile-card-gap">
                        {it.askingPrice && <span className="card-bid">Price <span className="card-bid-val">₹{it.askingPrice}</span></span>}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="cards-grid">
                  {auctionsCreated.length === 0 ? <p style={{ color: '#888' }}>No auctions created yet.</p> : null}
                  {auctionsCreated.map(au => (
                    <Link to={`/auctions/${au._id}`} key={au._id} className="item-card">
                      <div className="card-header">
                        <span className="card-title" title={au.item?.title}>{au.item?.title}</span>
                        <span className={`badge ${au.isActive ? 'badge-live' : 'badge-ended'}`}>
                          {au.isActive ? 'LIVE' : 'ENDED'}
                        </span>
                      </div>
                      <div className="card-image-wrapper">
                        <img src={getImage(au.item)} alt={au.item?.title} className="card-image" />
                      </div>
                      <div className="card-footer profile-card-gap">
                        <span className="card-bid">Bid for <span className="card-bid-val">₹{au.currentHighestBid}</span></span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-section">
            <h3 className="section-heading">Auctions I Won ({wonAuctions.length})</h3>
            {wonAuctions.length === 0 ? (
              <p style={{ color: '#888', marginBottom: '3rem' }}>No winning auctions yet.</p>
            ) : (
              wonAuctions.map(au => (
                <Link to={`/auctions/${au._id}`} key={au._id} className="won-card">
                  <div className="won-img-wrapper">
                    <img src={getImage(au.item)} alt={au.item?.title} className="won-img" />
                  </div>
                  <div className="won-text">
                    Won for ₹{au.soldPrice}
                  </div>
                  <div className="won-score-box">
                    <div className="won-score-numbers">76<br/>57<br/>52<br/>43</div>
                    <div className="won-trophy">🏆</div>
                  </div>
                </Link>
              ))
            )}

            <h3 className="section-heading">My Bids</h3>
            <div className="bids-container">
              {bidHistory.length === 0 ? (
                <p style={{ color: '#888' }}>No bids placed yet.</p>
              ) : (
                // Reversing the array to show recent bids first if the backend doesn't sort
                bidHistory.slice().reverse().map((bid, i) => (
                  <Link to={`/auctions/${bid.auction?._id}`} key={bid._id || i} className="bid-row">
                    <span className="bid-date">{formatDate(bid.createdAt)}</span>
                    <span className="bid-amount">₹{bid.amount}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}