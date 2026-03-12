import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "./NavBar";
import "./auctionDetail.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function AuctionDetail() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const token = localStorage.getItem("token");

  const fetchAuction = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auctions/${id}`);
      if (!res.ok) throw new Error("Failed to load auction");
      const data = await res.json();
      setAuction(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchAuction();
    const timer = setInterval(fetchAuction, 5000);
    return () => clearInterval(timer);
  }, [id]);

  const placeBid = async () => {
    if (!bidAmount) return;
    try {
      setError("");
      setMessage("");
      const res = await fetch(`${API_BASE_URL}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ auctionId: id, amount: parseFloat(bidAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Bid failed");
      } else {
        setMessage("Bid placed successfully");
        setBidAmount("");
        fetchAuction();
      }
    } catch (err) {
      setError("Network error");
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!auction) return <p>Loading auction...</p>;

  const now = new Date();
  const ended = new Date(auction.endTime) <= now || !auction.isActive;

  // Get all images: use auction.item.images array if available, fallback to single image
  const allImages = (auction.item?.images && auction.item.images.length > 0)
    ? auction.item.images
    : auction.item?.image
    ? [auction.item.image]
    : [];

  const displayImage = allImages[selectedImage] || allImages[0];

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <NavBar />
      <h2 style={{ padding: "1rem" }}>{auction.item?.title}</h2>
      
      {/* Image Gallery Section */}
      {displayImage && (
        <div className="image-gallery-container">
          {/* Main Image */}
          <div className="main-image-wrapper">
            <img
              src={displayImage}
              alt={auction.item?.title}
              className="main-image"
            />
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="thumbnails-wrapper">
              {allImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className={`thumbnail ${selectedImage === index ? "active" : ""}`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <p>{auction.item?.description}</p>
      <p>Seller: {auction.seller?.name}</p>
      <p>Current highest bid: ₹{auction.currentHighestBid}</p>
      <p>
        Ends: {new Date(auction.endTime).toLocaleString()} (Status:{" "}
        {ended ? "ended" : "active"})
      </p>

      {!ended && auction.seller?._id !== JSON.parse(localStorage.getItem("user") || "{}").id ? (
  <div style={{ marginTop: "1rem" }}>
    <input
      type="number"
      placeholder="Your bid"
      value={bidAmount}
      onChange={(e) => setBidAmount(e.target.value)}
    />
    <button onClick={placeBid}>Place bid</button>
  </div>
) : !ended && auction.seller?._id === JSON.parse(localStorage.getItem("user") || "{}").id ? (
  <div style={{ marginTop: "1rem", background: "#fff3cd", padding: "1rem", borderRadius: "8px", color: "#856404" }}>
    ℹ️ This is your own auction. You cannot bid on it.
  </div>
) : (
  <p style={{ color: "#999", marginTop: "1rem" }}>Auction has ended.</p>
)}

      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}
