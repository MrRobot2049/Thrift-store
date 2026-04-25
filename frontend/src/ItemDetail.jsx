import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavBar from "./NavBar";
import "./itemDetail.css";

const API_BASE_URL = "/api";
const NON_AUCTION_TYPES = ["merchandise", "comedy", "event", "concert"];
const TYPE_ICONS = { merchandise: "🛍️", comedy: "🎤", event: "👥", concert: "🎸" };

function TimeRemaining({ endTime }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setRemaining("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m left` : m > 0 ? `${m}m ${s}s left` : `${s}s left`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return <span>{remaining}</span>;
}

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [buyQty, setBuyQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [itemBuyers, setItemBuyers] = useState([]);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [buyersError, setBuyersError] = useState("");

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id || currentUser._id || "";

  useEffect(() => {
    fetch(`${API_BASE_URL}/items/${id}`)
      .then(r => r.json()).then(setItem).catch(err => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!item || NON_AUCTION_TYPES.includes(item.listingType)) return;
    const fetchAuction = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auctions?itemId=${id}`, { credentials: "include" });
        if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length > 0) setAuction(d[0]); }
      } catch (e) { console.error(e); }
    };
    fetchAuction();
    const interval = setInterval(fetchAuction, 5000);
    return () => clearInterval(interval);
  }, [id, item]);

  useEffect(() => {
    if (!token || !item) {
      return;
    }

    const sellerId = typeof item.seller === "object" ? item.seller?._id : item.seller;
    const ownListing = Boolean(
      currentUserId &&
      sellerId &&
      sellerId === currentUserId
    );
    const ticketListing = ["comedy", "concert", "event"].includes(item.listingType);

    if (!ownListing || !ticketListing) {
      setItemBuyers([]);
      setBuyersError("");
      setBuyersLoading(false);
      return;
    }

    const fetchItemBuyers = async () => {
      try {
        setBuyersLoading(true);
        setBuyersError("");

        const res = await fetch(`${API_BASE_URL}/purchases/item/${id}/buyers`, {
          credentials: "include",
          headers: { Authorization: token },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load buyers");
        }

        setItemBuyers(Array.isArray(data.purchases) ? data.purchases : []);
      } catch (err) {
        setBuyersError(err.message || "Failed to load buyers");
      } finally {
        setBuyersLoading(false);
      }
    };

    fetchItemBuyers();
  }, [id, item, token, currentUserId]);

  // ── Buy Now ──
  const handleBuyNow = async () => {
    if (!token) { setError("Please log in to purchase"); return; }
    if (item.listingType === "merchandise" && item.sizeInventory?.length > 0 && !selectedSize) {
      setError("Please select a size"); return;
    }
    if (["comedy", "concert"].includes(item.listingType) && item.ticketTiers?.length > 0 && !selectedTier) {
      setError("Please select a ticket tier"); return;
    }
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/items/${id}/buy`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ quantity: buyQty, size: selectedSize || undefined, tierName: selectedTier || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Purchase failed");
      setMessage(`✅ Purchase successful!${data.item?.status === "sold" ? " Now out of stock." : " Stock updated."}`);
      setItem(data.item);
      setSelectedSize(""); setSelectedTier(""); setBuyQty(1);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Place Bid ──
  const placeBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) { setError("Please enter a valid bid amount"); return; }
    if (!token) { setError("Please login to bid"); return; }
    try {
      setLoading(true); setError(""); setMessage("");
      const amount = parseFloat(bidAmount);
      const askingPrice = parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0"));
      const minBid = auction ? Math.max(askingPrice, auction.currentHighestBid) + 1 : askingPrice;
      if (amount < minBid) { setError(`Minimum bid amount is ₹${minBid}`); setLoading(false); return; }

      let auctionId = auction?._id;
      if (!auction) {
        const endTime = new Date(Date.now() + item.biddingDuration * 60 * 60 * 1000);
        const ar = await fetch(`${API_BASE_URL}/auctions`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json", Authorization: token },
          body: JSON.stringify({ itemId: id, startingPrice: askingPrice, endTime: endTime.toISOString() }),
        });
        if (!ar.ok) throw new Error("Failed to create auction");
        const na = await ar.json(); auctionId = na._id; setAuction(na);
      }
      const br = await fetch(`${API_BASE_URL}/bids`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ auctionId, amount }),
      });
      if (!br.ok) { const d = await br.json(); throw new Error(d.message || "Failed to place bid"); }
      setMessage("Bid placed successfully!"); setBidAmount("");
      const ur = await fetch(`${API_BASE_URL}/auctions/${auctionId}`, { credentials: "include" });
      if (ur.ok) setAuction(await ur.json());
    } catch (err) { setError(err.message || "Error placing bid"); }
    finally { setLoading(false); }
  };

  if (error && !item) return <p className="item-detail-msg error">{error}</p>;
  if (!item) return <p className="item-detail-msg">Loading...</p>;

  const allImages = (item.images && item.images.length > 0) ? item.images : item.image ? [item.image] : [];
  const displayImage = allImages[selectedImage] || allImages[0];
  const sellerId = typeof item.seller === "object" ? item.seller?._id : item.seller;
  const isOwnItem = Boolean(currentUserId && sellerId && sellerId === currentUserId);
  const auctionEnded = auction && (new Date(auction.endTime) <= new Date() || !auction.isActive);
  const isNonAuction = NON_AUCTION_TYPES.includes(item.listingType);
  const isTicketListing = ["comedy", "concert", "event"].includes(item.listingType);

  // Type-aware out-of-stock check
  const computeOutOfStock = () => {
    if (item.status === "sold") return true;
    if (item.listingType === "merchandise") {
      if (item.sizeInventory && item.sizeInventory.length > 0)
        return item.sizeInventory.reduce((acc, s) => acc + (s.quantity || 0), 0) === 0;
      return item.quantity === 0;
    }
    if (["comedy", "concert"].includes(item.listingType)) {
      if (item.ticketTiers && item.ticketTiers.length > 0)
        return item.ticketTiers.reduce((acc, t) => acc + (t.quantity || 0), 0) === 0;
      return false; // no tiers = assume available
    }
    if (item.listingType === "event") {
      if (!item.eventCapacity) return false;
      return (item.registeredCount || 0) >= item.eventCapacity;
    }
    return item.quantity === 0;
  };
  const outOfStock = computeOutOfStock();

  // Stock label for the strip
  const stockLabel = () => {
    if (item.listingType === "merchandise" && item.sizeInventory?.length > 0) {
      const total = item.sizeInventory.reduce((a, s) => a + (s.quantity || 0), 0);
      return outOfStock ? "Out of Stock" : `${total} units`;
    }
    if (["comedy", "concert"].includes(item.listingType) && item.ticketTiers?.length > 0) {
      const total = item.ticketTiers.reduce((a, t) => a + (t.quantity || 0), 0);
      return outOfStock ? "Sold Out" : `${total} tickets`;
    }
    if (item.listingType === "event") {
      const avail = (item.eventCapacity || 0) - (item.registeredCount || 0);
      return outOfStock ? "Fully Booked" : `${avail} spots left`;
    }
    return item.quantity > 0 ? `${item.quantity} left` : "Out of Stock";
  };

  return (
    <div className="item-detail-page">
      <NavBar />
      <div className="item-detail-container">
        <div className="ornate-frame">
          <div className="ornate-frame-inner">
            <div className="item-detail-grid">

              {/* ── Image ── */}
              <div className="image-section">
                <div className="wood-picture-frame">
                  {displayImage
                    ? <img src={displayImage} alt={item.title} className="framed-image" />
                    : <div className="no-image">{TYPE_ICONS[item.listingType] || "📦"}</div>}
                  <div className="frame-corner br-tl" /><div className="frame-corner br-tr" />
                  <div className="frame-corner br-bl" /><div className="frame-corner br-br" />
                </div>
                {allImages.length > 1 && (
                  <div className="thumbnails-wrapper">
                    {allImages.map((img, i) => (
                      <img key={i} src={img} alt={`Thumb ${i + 1}`}
                        className={`thumbnail ${selectedImage === i ? "active" : ""}`}
                        onClick={() => setSelectedImage(i)} />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Details ── */}
              <div className="details-section">
                <h1 className="item-title">{item.title}</h1>
                <p className="item-category">
                  {isNonAuction
                    ? `${TYPE_ICONS[item.listingType] || ""} ${item.listingType?.toUpperCase()}`
                    : [item.category, item.subcategory, item.nestedSubcategory].filter(Boolean).join(" / ").toUpperCase() || "ITEM"}
                </p>
                <p className="seller-info">Seller: <strong>{item.seller?.name || "Unknown"}</strong></p>

                {/* ── NON-AUCTION UI ── */}
                {isNonAuction ? (
                  <>
                    {/* Price + stock strip */}
                    <div className="price-strip">
                      <div className="price-strip-col">
                        <div className="price-strip-label">PRICE</div>
                        <div className="price-strip-value asking">
                          {["comedy", "concert"].includes(item.listingType) && item.ticketTiers?.length > 0
                            ? `From ₹${Math.min(...item.ticketTiers.map(t => t.price))}`
                            : item.listingType === "event" && item.askingPrice === 0
                              ? "Free"
                              : `₹${item.askingPrice || 0}`}
                        </div>
                      </div>
                      <div className="price-strip-divider" />
                      <div className="price-strip-col">
                        <div className="price-strip-label">STOCK</div>
                        <div className={`price-strip-value ${outOfStock ? "time" : "highest"}`}>
                          {stockLabel()}
                        </div>
                      </div>
                    </div>

                    {/* Venue / Date / Artist */}
                    {item.venue && <p style={{ color: "#7a5e3d", marginBottom: "0.3rem" }}>📍 {item.venue}</p>}
                    {item.eventDate && <p style={{ color: "#7a5e3d", marginBottom: "0.3rem" }}>📅 {item.eventDate}</p>}
                    {item.headlineArtist && <p style={{ color: "#7a5e3d", marginBottom: "0.8rem" }}>🎤 {item.headlineArtist}</p>}

                    <div className="item-description-box">
                      <p className="description-label">Description</p>
                      <p className="description-text">{item.description}</p>
                    </div>

                    {/* ── Buy / Register Panel ── */}
                    {!isOwnItem && (
                      outOfStock ? (
                        <div className="status-notice ended" style={{ background: "#fff0f0", borderColor: "#e74c3c", color: "#c0392b" }}>
                          🚫 {item.listingType === "event" ? "Event is fully booked." : item.listingType === "concert" || item.listingType === "comedy" ? "All tickets sold out." : "Out of Stock — This item is no longer available."}
                        </div>
                      ) : (
                        <div className="bid-form-box">
                          <div className="bid-form-header" style={{ background: "linear-gradient(135deg,#2b1d0f,#4a3826)" }}>
                            {item.listingType === "event" ? "Register" : "Buy Tickets / Purchase"}
                          </div>
                          <div className="bid-form-body">

                            {/* Merch: size selector */}
                            {item.listingType === "merchandise" && item.sizeInventory?.length > 0 && (
                              <div className="form-group">
                                <label>Select Size</label>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: 6 }}>
                                  {item.sizeInventory.map(si => {
                                    const inStock = si.quantity > 0;
                                    return (
                                      <button key={si.size} type="button" onClick={() => inStock && setSelectedSize(si.size)}
                                        style={{ padding: "0.4rem 0.85rem", borderRadius: 6,
                                          cursor: inStock ? "pointer" : "not-allowed",
                                          border: selectedSize === si.size ? "2px solid #2b1d0f" : "1px solid #dabe82",
                                          background: !inStock ? "#f0f0f0" : selectedSize === si.size ? "#2b1d0f" : "#faf6eb",
                                          color: !inStock ? "#aaa" : selectedSize === si.size ? "#dabe82" : "#4a3826",
                                          fontWeight: 600, fontSize: "0.85rem" }}>
                                        {si.size}
                                        <span style={{ display: "block", fontSize: "0.65rem", fontWeight: 400 }}>
                                          {inStock ? `${si.quantity} left` : "Out"}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Comedy/Concert: tier selector */}
                            {["comedy", "concert"].includes(item.listingType) && item.ticketTiers?.length > 0 && (
                              <div className="form-group">
                                <label>Select Ticket Tier</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: 6 }}>
                                  {item.ticketTiers.map(t => {
                                    const inStock = t.quantity > 0;
                                    return (
                                      <button key={t.tierName} type="button" onClick={() => inStock && setSelectedTier(t.tierName)}
                                        style={{ padding: "0.6rem 1rem", borderRadius: 8,
                                          cursor: inStock ? "pointer" : "not-allowed",
                                          border: selectedTier === t.tierName ? "2px solid #2b1d0f" : "1px solid #dabe82",
                                          background: !inStock ? "#f0f0f0" : selectedTier === t.tierName ? "#2b1d0f" : "#faf6eb",
                                          color: !inStock ? "#aaa" : selectedTier === t.tierName ? "#dabe82" : "#2b1d0f",
                                          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontWeight: 600 }}>{t.tierName}</span>
                                        <span>
                                          <span style={{ fontWeight: 700, marginRight: 10 }}>₹{t.price}</span>
                                          <span style={{ fontSize: "0.75rem" }}>{inStock ? `${t.quantity} left` : "Sold out"}</span>
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Event: spot counter */}
                            {item.listingType === "event" && (
                              <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "#faf6eb", borderRadius: 8, border: "1px solid #dabe82" }}>
                                <div style={{ fontSize: "0.8rem", color: "#7a5e3d", marginBottom: 4 }}>AVAILABLE SPOTS</div>
                                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2b1d0f" }}>
                                  {(item.eventCapacity || 0) - (item.registeredCount || 0)} / {item.eventCapacity || 0}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#9b8770" }}>{item.registeredCount || 0} already registered</div>
                              </div>
                            )}

                            {/* Quantity (not for events) */}
                            {item.listingType !== "event" && (
                              <div className="form-group">
                                <label>Quantity</label>
                                <input type="number" className="vintage-input" min="1"
                                  max={selectedSize ? (item.sizeInventory?.find(s => s.size === selectedSize)?.quantity || 1) : (item.quantity || 99)}
                                  value={buyQty} onChange={e => setBuyQty(Math.max(1, parseInt(e.target.value) || 1))} />
                              </div>
                            )}

                            {/* Price total */}
                            <div style={{ marginBottom: "0.75rem", fontSize: "1.2rem", fontWeight: 700, color: "#2b1d0f" }}>
                              {item.listingType === "event"
                                ? item.askingPrice > 0 ? `Entry Fee: ₹${item.askingPrice}` : "Free Registration"
                                : `Total: ₹${((selectedTier
                                    ? (item.ticketTiers?.find(t => t.tierName === selectedTier)?.price || item.askingPrice)
                                    : item.askingPrice) * buyQty).toLocaleString("en-IN")}`}
                            </div>

                            <button onClick={handleBuyNow} disabled={loading} className="vintage-btn block-btn"
                              style={{ background: "linear-gradient(135deg,#2b1d0f,#4a3826)", letterSpacing: "0.05em" }}>
                              {loading ? "Processing..." : item.listingType === "event" ? "Register Now" : "Buy Now"}
                            </button>
                            {error && <p className="form-msg error">{error}</p>}
                            {message && <p className="form-msg success">{message}</p>}
                          </div>
                        </div>
                      )
                    )}
                    {isOwnItem && <div className="status-notice warning">This is your own listing.</div>}
                    {isOwnItem && isTicketListing && (
                      <div style={{ marginTop: "1rem", padding: "0.9rem", border: "1px solid #dabe82", borderRadius: 10, background: "#fff8eb" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                          <h3 style={{ margin: 0, fontSize: "1rem", color: "#3a2a17" }}>Ticket Buyers</h3>
                          <span style={{ fontSize: "0.8rem", color: "#7a5e3d" }}>{itemBuyers.length} purchase(s)</span>
                        </div>

                        {buyersLoading && <p style={{ margin: 0, color: "#7a5e3d" }}>Loading buyers...</p>}
                        {!buyersLoading && buyersError && <p style={{ margin: 0, color: "#b03a2e" }}>{buyersError}</p>}

                        {!buyersLoading && !buyersError && itemBuyers.length === 0 && (
                          <p style={{ margin: 0, color: "#7a5e3d" }}>No confirmed ticket purchases yet.</p>
                        )}

                        {!buyersLoading && !buyersError && itemBuyers.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                            {itemBuyers.map((purchase) => (
                              <div
                                key={purchase._id}
                                style={{
                                  border: "1px solid #ead9bc",
                                  borderRadius: 8,
                                  padding: "0.55rem 0.65rem",
                                  background: "#fffdf8",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: "0.75rem",
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 700, color: "#2b1d0f" }}>
                                    {purchase.buyer?.name || "Buyer"}
                                  </div>
                                  <div style={{ fontSize: "0.78rem", color: "#7a5e3d" }}>
                                    {purchase.buyer?.email || "No email"}
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "#8f7a5e", marginTop: 2 }}>
                                    Qty: {purchase.quantity}
                                    {purchase.tierName ? ` • Tier: ${purchase.tierName}` : ""}
                                    {purchase.size ? ` • Size: ${purchase.size}` : ""}
                                    {` • ₹${Number(purchase.totalPrice || 0).toLocaleString("en-IN")}`}
                                  </div>
                                </div>
                                <Link
                                  to={`/chat/purchase/${purchase._id}`}
                                  className="vintage-btn"
                                  style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                                >
                                  Chat Buyer
                                </Link>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* ── AUCTION UI ── */
                  <>
                    <div className="price-strip">
                      <div className="price-strip-col">
                        <div className="price-strip-label">ASKING PRICE</div>
                        <div className="price-strip-value asking">₹{item.askingPrice || (auction ? auction.startingPrice : "N/A")}</div>
                      </div>
                      <div className="price-strip-divider" />
                      <div className="price-strip-col">
                        <div className="price-strip-label">CURRENT HIGHEST BID</div>
                        <div className="price-strip-value highest">
                          {auction && auction.currentHighestBid ? `₹${auction.currentHighestBid}` : "—"}
                        </div>
                      </div>
                      <div className="price-strip-divider" />
                      <div className="price-strip-col">
                        <div className="price-strip-label">TIME REMAINING</div>
                        <div className="price-strip-value time">
                          {auction && !auctionEnded ? <TimeRemaining endTime={auction.endTime} /> : auctionEnded ? "Ended" : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="item-description-box">
                      <p className="description-label">Description</p>
                      <p className="description-text">{item.description}</p>
                    </div>
                    {!isOwnItem && !auctionEnded && (
                      <div className="bid-form-box">
                        <div className="bid-form-header">Place Your Bid</div>
                        <div className="bid-form-body">
                          <div className="form-group">
                            <label>Bid Amount</label>
                            <input type="number" className="vintage-input"
                              placeholder={`Min: ₹${auction ? Math.max(parseFloat(item.askingPrice || 0), auction.currentHighestBid) + 1 : parseFloat(item.askingPrice || 0)}`}
                              value={bidAmount} onChange={e => setBidAmount(e.target.value)} disabled={loading} />
                          </div>
                          <button onClick={placeBid} disabled={loading} className="vintage-btn block-btn">
                            {loading ? "Placing bid..." : "Start Auction & Bid"}
                          </button>
                          {error && <p className="form-msg error">{error}</p>}
                          {message && <p className="form-msg success">{message}</p>}
                        </div>
                      </div>
                    )}
                    {isOwnItem && <div className="status-notice warning">This is your own listing. You cannot bid on it.</div>}
                    {auctionEnded && <div className="status-notice ended">This auction has ended.</div>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
