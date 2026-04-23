import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../sellForms.css";
import { apiFetch } from "./apiFetch";

const API_BASE_URL = "/api";
const CLOUDINARY_UPLOAD_URL = process.env.REACT_APP_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;

const TIER_NAMES = ["Platinum Seating", "VIP", "Early Bird", "General Admission", "Standard", "Student"];

export default function ComedyForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Each tier: { name, qty, price }
  const [tiers, setTiers] = useState([
    { name: "Platinum Seating", qty: 50, price: "" },
    { name: "General Admission", qty: 200, price: "" },
  ]);
  const [form, setForm] = useState({ showTitle: "", headlineArtist: "", performanceDate: "", venue: "" });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateTier = (i, field, val) =>
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));

  const addTier = () => setTiers(prev => [...prev, { name: "Standard", qty: 100, price: "" }]);
  const removeTier = (i) => setTiers(prev => prev.filter((_, idx) => idx !== i));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = evt => setImagePreviews(prev => [...prev, evt.target.result]);
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (i) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const uploadImages = async () => {
    if (!imageFiles.length || !CLOUDINARY_UPLOAD_URL || !CLOUDINARY_PRESET) return [];
    const urls = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const fd = new FormData();
      fd.append("file", imageFiles[i]);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      try {
        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: fd });
        if (!res.ok) throw new Error(`Cloudinary ${res.status}`);
        const d = await res.json(); urls.push(d.secure_url);
      } catch (e) { console.warn("Image skip:", e.message); }
      setProgress(20 + Math.round((i + 1) / imageFiles.length * 50));
    }
    return urls;
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.showTitle) { setError("Show title is required"); return; }
    const validTiers = tiers.filter(t => t.price && parseFloat(t.price) > 0 && t.qty > 0);
    if (validTiers.length === 0) { setError("Add at least one ticket tier with price and quantity"); return; }
    const token = localStorage.getItem("token");
    if (!token) { setError("You must be logged in"); return; }

    try {
      setLoading(true); setProgress(10);
      const imageUrls = await uploadImages();
      setProgress(75);
      const ticketTiers = validTiers.map(t => ({ tierName: t.name, quantity: parseInt(t.qty), price: parseFloat(t.price) }));
      const lowestPrice = Math.min(...ticketTiers.map(t => t.price));

      await apiFetch(`${API_BASE_URL}/items`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({
          title: form.showTitle,
          description: `Comedy Performance by ${form.headlineArtist || "TBA"} at ${form.venue || "TBA"} on ${form.performanceDate || "TBA"}`,
          category: "Comedy Show", listingType: "comedy",
          askingPrice: lowestPrice,
          image: imageUrls[0] || "", images: imageUrls,
          headlineArtist: form.headlineArtist, venue: form.venue,
          eventDate: form.performanceDate, ticketTiers,
        }),
      });
      setProgress(100); setSuccess("🎤 Comedy show listed successfully!");
      setTimeout(() => navigate("/merchandise"), 1500);
    } catch (err) { setError(err.message || "Something went wrong."); setProgress(0); }
    finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="premium-forms-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      <div className="premium-form-box theme-comedy">
        <div className="form-header-icon">🎤</div>
        <h1 className="premium-title">Create a Bespoke Comedy Performance</h1>
        {error && <div style={{ color: "#f8c291", background: "rgba(255,100,50,0.15)", padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ color: "#2ecc71", background: "rgba(46,204,113,0.1)", padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>{success}</div>}

        <div className="form-row">
          <div className="form-col"><label className="premium-label">Show Title *</label><input type="text" className="premium-input" value={form.showTitle} onChange={set("showTitle")} /></div>
          <div className="form-col"><label className="premium-label">Headline Artist</label><input type="text" className="premium-input" value={form.headlineArtist} onChange={set("headlineArtist")} /></div>
        </div>
        <div className="form-row">
          <div className="form-col"><label className="premium-label">Performance Date & Time</label><input type="datetime-local" className="premium-input" value={form.performanceDate} onChange={set("performanceDate")} /></div>
          <div className="form-col"><label className="premium-label">Venue</label><input type="text" className="premium-input" value={form.venue} onChange={set("venue")} /></div>
        </div>

        {/* Ticket Tiers */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="premium-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Ticket Tiers (name · quantity · price)
            <button type="button" onClick={addTier}
              style={{ fontSize: "0.8rem", padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(218,190,130,0.5)", background: "rgba(218,190,130,0.1)", color: "#dabe82", cursor: "pointer" }}>
              + Add Tier
            </button>
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.5rem" }}>
            {tiers.map((tier, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select className="premium-select" style={{ flex: 2 }} value={tier.name} onChange={e => updateTier(i, "name", e.target.value)}>
                  {TIER_NAMES.map(n => <option key={n}>{n}</option>)}
                </select>
                <div style={{ flex: 1, position: "relative" }}>
                  <input type="number" className="premium-input" value={tier.qty} min="1"
                    onChange={e => updateTier(i, "qty", e.target.value)} placeholder="Qty" />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "rgba(218,190,130,0.6)" }}>seats</span>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <input type="number" className="premium-input" value={tier.price} min="0"
                    onChange={e => updateTier(i, "price", e.target.value)} placeholder="₹ Price" />
                </div>
                {tiers.length > 1 && (
                  <button type="button" onClick={() => removeTier(i)}
                    style={{ background: "rgba(220,53,69,0.15)", border: "1px solid rgba(220,53,69,0.4)", color: "#ff6b6b", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "rgba(218,190,130,0.7)", marginTop: 6 }}>
            Total seats: {tiers.reduce((a, t) => a + (parseInt(t.qty) || 0), 0)}
          </p>
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="premium-label">Poster Art ({imageFiles.length} selected)</label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
          {imagePreviews.length === 0
            ? <div className="upload-box-wide" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer", marginTop: 8 }}>📸 Click to upload poster images</div>
            : <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: "relative", width: 70, height: 70 }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                    <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: 1, right: 1, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10 }}>✕</button>
                  </div>
                ))}
                <div onClick={() => fileInputRef.current?.click()} style={{ width: 70, height: 70, border: "1px dashed rgba(218,190,130,0.4)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#dabe82", fontSize: "1.4rem" }}>+</div>
              </div>
          }
        </div>

        {loading && progress > 0 && <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}><div style={{ width: `${progress}%`, background: "linear-gradient(90deg,#dabe82,#a88b50)", height: 6, transition: "width 0.3s" }} /></div>}
        <button className="premium-submit" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? `Processing... ${progress}%` : "FINALIZE EVENT DETAILS"}
        </button>
      </div>
    </div>
  );
}
