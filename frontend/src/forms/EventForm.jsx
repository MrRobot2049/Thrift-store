import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../sellForms.css";
import { apiFetch } from "./apiFetch";

const API_BASE_URL = "/api";
const CLOUDINARY_UPLOAD_URL = process.env.REACT_APP_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;

export default function EventForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ eventTitle: "", description: "", organizerContact: "", eventCategory: "", registrationStructure: "Free", capacity: "", entryFee: "" });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    if (!form.eventTitle) { setError("Event title is required"); return; }
    if (!form.capacity || parseInt(form.capacity) <= 0) { setError("Please enter a valid participant capacity"); return; }
    const token = localStorage.getItem("token");
    if (!token) { setError("You must be logged in"); return; }
    try {
      setLoading(true); setProgress(10);
      const imageUrls = await uploadImages();
      setProgress(75);
      const fee = form.registrationStructure === "Free" ? 0 : (parseFloat(form.entryFee) || 0);
      await apiFetch(`${API_BASE_URL}/items`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({
          title: form.eventTitle,
          description: form.description || `Event by ${form.organizerContact || "TBA"}. Category: ${form.eventCategory}.`,
          category: "Event", listingType: "event", askingPrice: fee,
          image: imageUrls[0] || "", images: imageUrls,
          organizerContact: form.organizerContact,
          eventCapacity: parseInt(form.capacity), registeredCount: 0,
        }),
      });
      setProgress(100); setSuccess("🎟️ Event listed successfully!");
      setTimeout(() => navigate("/merchandise"), 1500);
    } catch (err) { setError(err.message || "Something went wrong."); setProgress(0); }
    finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="premium-forms-container theme-event-container">
      <button className="back-btn" onClick={() => navigate(-1)} style={{ color: "#4a3826", borderColor: "rgba(74,56,38,0.3)" }}>← Back</button>
      <div className="premium-form-box theme-event">
        <div className="form-header-icon">👥</div>
        <h1 className="premium-title">Initialize an Event Registration Form</h1>
        {error && <div style={{ color: "#c0392b", background: "#fdecea", padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ color: "#27ae60", background: "#eafaf1", padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>{success}</div>}

        <div className="form-row">
          <div className="form-col"><label className="premium-label">Event Title *</label><input type="text" className="premium-input" value={form.eventTitle} onChange={set("eventTitle")} /></div>
          <div className="form-col"><label className="premium-label">Organizer Contact</label><input type="text" className="premium-input" value={form.organizerContact} onChange={set("organizerContact")} /></div>
        </div>
        <div className="form-row">
          <div className="form-col">
            <label className="premium-label">Event Category</label>
            <select className="premium-select" value={form.eventCategory} onChange={set("eventCategory")}>
              <option value="">Select...</option><option>Workshop</option><option>Seminar</option><option>Cultural</option><option>Sports</option><option>Tech</option>
            </select>
          </div>
          <div className="form-col">
            <label className="premium-label">Registration Structure</label>
            <select className="premium-select" value={form.registrationStructure} onChange={set("registrationStructure")}>
              <option>Free</option><option>Paid</option><option>Invite Only</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-col">
            <label className="premium-label">Participant Capacity * <span style={{ fontSize: "0.75rem", color: "#9b8770", fontWeight: 400 }}>(total registration slots)</span></label>
            <input type="number" className="premium-input" placeholder="e.g. 200" min="1" value={form.capacity} onChange={set("capacity")} />
          </div>
          {form.registrationStructure === "Paid" && (
            <div className="form-col">
              <label className="premium-label">Entry Fee (₹)</label>
              <input type="number" className="premium-input" placeholder="e.g. 100" min="0" value={form.entryFee} onChange={set("entryFee")} />
            </div>
          )}
        </div>
        <div className="form-row">
          <div className="form-col">
            <label className="premium-label">Description</label>
            <textarea className="premium-textarea" value={form.description} onChange={set("description")} placeholder="Describe the event..." />
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label className="premium-label">Event Images</label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {imagePreviews.map((src, i) => (
              <div key={i} style={{ position: "relative", width: 70, height: 70 }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px dashed #7a5e3d" }} />
                <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: 1, right: 1, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10 }}>✕</button>
              </div>
            ))}
            <div onClick={() => fileInputRef.current?.click()} style={{ width: 70, height: 70, border: "1px dashed #7a5e3d", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#7a5e3d", gap: 4 }}>
              <span style={{ fontSize: "1.3rem" }}>📷</span><span style={{ fontSize: "0.65rem" }}>Add</span>
            </div>
          </div>
        </div>

        {loading && progress > 0 && <div style={{ background: "#e8dcc8", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}><div style={{ width: `${progress}%`, background: "#4a3826", height: 6, transition: "width 0.3s" }} /></div>}
        <button className="premium-submit" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? `Processing... ${progress}%` : "CONFIRM EVENT FORM"}
        </button>
      </div>
    </div>
  );
}
