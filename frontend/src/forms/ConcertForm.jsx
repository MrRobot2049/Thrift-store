import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../sellForms.css";
import { apiFetch } from "./apiFetch";
import { API_BASE_URL } from "../apiConfig";

const CLOUDINARY_UPLOAD_URL = process.env.REACT_APP_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;
const TIER_NAMES = ["Floor Standing", "Floor 2", "General Seating", "VIP", "Backstage Pass", "Early Bird", "Student"];

export default function ConcertForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ tourName: "", artists: "", venue: "", eventMonth: "07", eventYear: "2024", vipExperience: "" });
  const [tiers, setTiers] = useState([
    { name: "Floor Standing", qty: 500, price: "" },
    { name: "General Seating", qty: 1000, price: "" },
  ]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateTier = (i, field, val) => setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  const addTier = () => setTiers(prev => [...prev, { name: "VIP", qty: 50, price: "" }]);
  const removeTier = (i) => setTiers(prev => prev.filter((_, idx) => idx !== i));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(file => { const r = new FileReader(); r.onload = evt => setImagePreviews(prev => [...prev, evt.target.result]); r.readAsDataURL(file); });
  };
  const removeImage = (i) => { setImageFiles(p => p.filter((_, idx) => idx !== i)); setImagePreviews(p => p.filter((_, idx) => idx !== i)); };

  const uploadImages = async () => {
    if (!imageFiles.length || !CLOUDINARY_UPLOAD_URL || !CLOUDINARY_PRESET) return [];
    const urls = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const fd = new FormData(); fd.append("file", imageFiles[i]); fd.append("upload_preset", CLOUDINARY_PRESET);
      try { const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: fd }); if (!res.ok) throw new Error(); const d = await res.json(); urls.push(d.secure_url); } catch (e) { console.warn("skip", e); }
      setProgress(20 + Math.round((i + 1) / imageFiles.length * 50));
    }
    return urls;
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.tourName) { setError("Concert name is required"); return; }
    const validTiers = tiers.filter(t => t.price && parseFloat(t.price) > 0 && parseInt(t.qty) > 0);
    if (validTiers.length === 0) { setError("Add at least one ticket tier with price and quantity"); return; }
    const token = localStorage.getItem("token");
    if (!token) { setError("You must be logged in"); return; }
    try {
      setLoading(true); setProgress(10);
      const imageUrls = await uploadImages();
      setProgress(75);
      const ticketTiers = validTiers.map(t => ({ tierName: t.name, quantity: parseInt(t.qty), price: parseFloat(t.price) }));
      const prices = ticketTiers.map(t => t.price);
      await apiFetch(`${API_BASE_URL}/items`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({
          title: form.tourName,
          description: `Live Concert featuring ${form.artists || "TBA"} at ${form.venue || "TBA"}. ${form.vipExperience ? "VIP: " + form.vipExperience : ""}`,
          category: "Concert", listingType: "concert",
          askingPrice: Math.min(...prices),
          image: imageUrls[0] || "", images: imageUrls,
          headlineArtist: form.artists, venue: form.venue,
          eventDate: `${form.eventMonth}-${form.eventYear}`,
          vipExperience: form.vipExperience, ticketTiers,
        }),
      });
      setProgress(100); setSuccess("🎸 Concert announced successfully!");
      setTimeout(() => navigate("/merchandise"), 1500);
    } catch (err) { setError(err.message || "Something went wrong."); setProgress(0); }
    finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="premium-forms-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      <div className="premium-form-box theme-concert">
        <div className="form-header-icon" style={{ position: "relative", zIndex: 2 }}>🎼</div>
        <h1 className="premium-title">Launch a Premier Live Concert</h1>
        {error && <div style={{ color: "#e6b89c", background: "rgba(200,80,50,0.2)", padding: "10px 14px", borderRadius: 6, marginBottom: 16, position: "relative", zIndex: 2 }}>{error}</div>}
        {success && <div style={{ color: "#2ecc71", background: "rgba(46,204,113,0.1)", padding: "10px 14px", borderRadius: 6, marginBottom: 16, position: "relative", zIndex: 2 }}>{success}</div>}

        <div className="form-row" style={{ position: "relative", zIndex: 2 }}>
          <div className="form-col"><label className="premium-label">Concert Tour Name *</label><input type="text" className="premium-input" value={form.tourName} onChange={set("tourName")} /></div>
          <div className="form-col"><label className="premium-label">Featured Artists</label><input type="text" className="premium-input" value={form.artists} onChange={set("artists")} /></div>
        </div>
        <div className="form-row" style={{ position: "relative", zIndex: 2 }}>
          <div className="form-col"><label className="premium-label">Concert Venue (City)</label><input type="text" className="premium-input" value={form.venue} onChange={set("venue")} /></div>
          <div className="form-col">
            <label className="premium-label">Event Date</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input type="text" className="premium-input" placeholder="Month (07)" value={form.eventMonth} onChange={set("eventMonth")} />
              <input type="text" className="premium-input" placeholder="Year (2024)" value={form.eventYear} onChange={set("eventYear")} />
            </div>
          </div>
        </div>
        <div className="form-row" style={{ position: "relative", zIndex: 2 }}>
          <div className="form-col"><label className="premium-label">VIP Experience</label><input type="text" className="premium-input" value={form.vipExperience} onChange={set("vipExperience")} placeholder="e.g., Meet & Greet, Floor Seating" /></div>
        </div>

        {/* Ticket Tiers */}
        <div style={{ marginBottom: "1.5rem", position: "relative", zIndex: 2 }}>
          <label className="premium-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Ticket Tiers (name · seats available · price)
            <button type="button" onClick={addTier} style={{ fontSize: "0.8rem", padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(212,149,106,0.5)", background: "rgba(212,149,106,0.1)", color: "#d4956a", cursor: "pointer" }}>+ Add Tier</button>
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.5rem" }}>
            {tiers.map((tier, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select className="premium-select" style={{ flex: 2 }} value={tier.name} onChange={e => updateTier(i, "name", e.target.value)}>
                  {TIER_NAMES.map(n => <option key={n}>{n}</option>)}
                </select>
                <div style={{ flex: 1, position: "relative" }}>
                  <input type="number" className="premium-input" value={tier.qty} min="1" onChange={e => updateTier(i, "qty", e.target.value)} placeholder="Seats" />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "rgba(212,149,106,0.6)" }}>seats</span>
                </div>
                <input type="number" className="premium-input" style={{ flex: 1 }} value={tier.price} min="0" onChange={e => updateTier(i, "price", e.target.value)} placeholder="₹ Price" />
                {tiers.length > 1 && (
                  <button type="button" onClick={() => removeTier(i)} style={{ background: "rgba(220,53,69,0.15)", border: "1px solid rgba(220,53,69,0.4)", color: "#ff6b6b", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "rgba(212,149,106,0.7)", marginTop: 6 }}>
            Total seats: {tiers.reduce((a, t) => a + (parseInt(t.qty) || 0), 0)}
          </p>
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: "1.5rem", position: "relative", zIndex: 2 }}>
          <label className="premium-label">Artist / Concert Art ({imageFiles.length} selected)</label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
          {imagePreviews.length === 0
            ? <div className="upload-box-wide" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer", borderColor: "#8e5a3c", color: "#d4956a", marginTop: 8 }}>📸 Upload Artist / Concert Art</div>
            : <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: "relative", width: 70, height: 70 }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4, border: "1px solid #8e5a3c" }} />
                    <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: 1, right: 1, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10 }}>✕</button>
                  </div>
                ))}
                <div onClick={() => fileInputRef.current?.click()} style={{ width: 70, height: 70, border: "1px dashed #8e5a3c", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#d4956a", fontSize: "1.4rem", position: "relative", zIndex: 2 }}>+</div>
              </div>
          }
        </div>

        {loading && progress > 0 && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 16, position: "relative", zIndex: 2 }}><div style={{ width: `${progress}%`, background: "linear-gradient(90deg,#d4956a,#8e5a3c)", height: 6, transition: "width 0.3s" }} /></div>}
        <button className="premium-submit" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1, position: "relative", zIndex: 2 }}>
          {loading ? `Processing... ${progress}%` : "ANNOUNCE GRAND CONCERT"}
        </button>
      </div>
    </div>
  );
}
