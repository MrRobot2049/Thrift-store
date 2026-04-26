import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../sellForms.css";
import { apiFetch } from "./apiFetch";
import { API_BASE_URL } from "../apiConfig";

const CLOUDINARY_UPLOAD_URL = process.env.REACT_APP_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const DESIGN_VARIANTS = ["Classic", "Vintage", "Modern", "Limited Edition", "Signature", "Custom"];

export default function MerchandiseForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ category: "Apparel", designVariation: "", description: "", askingPrice: "" });
  // sizeInventory: { S: 20, M: 30, L: 10, ... }
  const [sizeInventory, setSizeInventory] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toggleSize = (size) => {
    setSizeInventory(prev => {
      if (prev[size] !== undefined) {
        const next = { ...prev };
        delete next[size];
        return next;
      }
      return { ...prev, [size]: 10 }; // default qty
    });
  };

  const setQty = (size, val) => {
    const n = Math.max(0, parseInt(val) || 0);
    setSizeInventory(prev => ({ ...prev, [size]: n }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 8) { setError("Maximum 8 images"); return; }
    setError("");
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
        const data = await res.json();
        urls.push(data.secure_url);
      } catch (e) { console.warn("Image skip:", e.message); }
      setProgress(20 + Math.round((i + 1) / imageFiles.length * 50));
    }
    return urls;
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.askingPrice || parseFloat(form.askingPrice) <= 0) { setError("Please enter a valid price"); return; }
    const selectedSizes = Object.keys(sizeInventory);
    if (form.category === "Apparel" && selectedSizes.length === 0) { setError("Please select at least one size and its stock count"); return; }
    const token = localStorage.getItem("token");
    if (!token) { setError("You must be logged in"); return; }

    try {
      setLoading(true); setProgress(10);
      const imageUrls = await uploadImages();
      setProgress(75);

      const sizeInventoryArr = selectedSizes.map(s => ({ size: s, quantity: sizeInventory[s] }));
      const totalQty = sizeInventoryArr.reduce((acc, s) => acc + s.quantity, 0);

      await apiFetch(`${API_BASE_URL}/items`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({
          title: `${form.category}${form.designVariation ? " — " + form.designVariation : ""}`,
          description: form.description || `${form.category} item. Sizes: ${selectedSizes.join(", ")}.`,
          category: "Merchandise", listingType: "merchandise",
          askingPrice: parseFloat(form.askingPrice),
          image: imageUrls[0] || "", images: imageUrls,
          sizes: selectedSizes,
          sizeInventory: sizeInventoryArr,
          designVariation: form.designVariation,
          quantity: totalQty,
        }),
      });
      setProgress(100); setSuccess("🎉 Merchandise listed successfully!");
      setTimeout(() => navigate("/merchandise"), 1500);
    } catch (err) { setError(err.message || "Something went wrong."); setProgress(0); }
    finally { setLoading(false); }
  };

  return (
    <div className="premium-forms-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      <div className="premium-form-box theme-merch">
        <div className="form-header-icon"><span>CM</span></div>
        <h1 className="premium-title">List University Merchandise</h1>
        {error && <div style={{ color: "#c0392b", background: "#fdecea", padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ color: "#27ae60", background: "#eafaf1", padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>{success}</div>}

        <div className="form-row">
          <div className="form-col" style={{ flex: 2 }}>
            <label className="premium-label">Item Category</label>
            <select className="premium-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option>Apparel</option><option>Accessories</option><option>Stationery</option><option>Sports Gear</option><option>Bags</option>
            </select>
          </div>
          <div className="form-col" style={{ flex: 2 }}>
            <label className="premium-label">Design Variation</label>
            <select className="premium-select" value={form.designVariation} onChange={e => setForm({ ...form, designVariation: e.target.value })}>
              <option value="">Select style</option>
              {DESIGN_VARIANTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-col" style={{ flex: 1 }}>
            <label className="premium-label">Price (₹) *</label>
            <input type="number" className="premium-input" placeholder="499" min="1" value={form.askingPrice} onChange={e => setForm({ ...form, askingPrice: e.target.value })} />
          </div>
        </div>

        {/* Size + Stock per size */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="premium-label">Size Stock (click a size to add it, then set quantity)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {ALL_SIZES.map(size => {
              const selected = sizeInventory[size] !== undefined;
              return (
                <div key={size} style={{ display: "flex", alignItems: "center", gap: 6, background: selected ? "#2b1d0f" : "#faf6eb", borderRadius: 8, padding: "0.4rem 0.7rem", border: selected ? "2px solid #2b1d0f" : "1px solid #dabe82", transition: "all 0.2s" }}>
                  <button type="button" onClick={() => toggleSize(size)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", color: selected ? "#dabe82" : "#4a3826", padding: 0 }}>
                    {size}
                  </button>
                  {selected && (
                    <input type="number" min="0" value={sizeInventory[size]}
                      onChange={e => setQty(size, e.target.value)}
                      style={{ width: 52, padding: "2px 6px", borderRadius: 4, border: "1px solid #dabe82", background: "#f5e8c8", fontSize: "0.8rem", textAlign: "center", color: "#2b1d0f" }} />
                  )}
                </div>
              );
            })}
          </div>
          {Object.keys(sizeInventory).length > 0 && (
            <p style={{ fontSize: "0.78rem", color: "#7a5e3d", marginTop: 6 }}>
              Total stock: {Object.values(sizeInventory).reduce((a, b) => a + b, 0)} units across {Object.keys(sizeInventory).length} size(s)
            </p>
          )}
        </div>

        <div className="form-row">
          <div className="form-col">
            <label className="premium-label">Specific Details</label>
            <textarea className="premium-textarea" placeholder="Add details about the merchandise..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label className="premium-label">Images (optional, up to 8)</label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
          <div className="premium-upload-area" style={{ marginTop: "0.5rem" }}>
            {imagePreviews.map((src, i) => (
              <div key={i} className="upload-box" style={{ position: "relative", padding: 0, overflow: "hidden" }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11 }}>✕</button>
              </div>
            ))}
            {imagePreviews.length < 8 && (
              <div className="upload-box" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer", border: "2px dashed #dabe82", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: "1.3rem" }}>📷</span>
                <span style={{ fontSize: "0.65rem", color: "#a38f78" }}>Add</span>
              </div>
            )}
          </div>
        </div>

        {loading && progress > 0 && (
          <div style={{ background: "#e8dcc8", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ width: `${progress}%`, background: "#2b1d0f", height: 6, transition: "width 0.3s" }} />
          </div>
        )}
        <button className="premium-submit" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? `Processing... ${progress}%` : "PUBLISH LIMITED EDITION ITEM"}
        </button>
      </div>
    </div>
  );
}
