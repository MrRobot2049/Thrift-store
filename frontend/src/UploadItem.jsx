import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./upload.css";
import { API_BASE_URL } from "./apiConfig";

const CLOUDINARY_UPLOAD_URL = process.env.REACT_APP_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;

export default function UploadItem() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    askingPrice: "",
    biddingDuration: 24,
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Create previews for new files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setImagePreviews((prev) => [...prev, evt.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImageToCloudinary = async () => {
    if (imageFiles.length === 0) {
      throw new Error("Please select at least one image");
    }

    const uploadedUrls = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const formData = new FormData();
      formData.append("file", imageFiles[i]);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image ${i + 1}`);
      }

      const data = await response.json();
      uploadedUrls.push(data.secure_url);

      // Update progress
      setUploadProgress(30 + (i / imageFiles.length) * 40);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.title ||
      !form.description ||
      !form.category ||
      !form.askingPrice ||
      imageFiles.length === 0
    ) {
      setError("Please fill all fields and select at least one image");
      return;
    }

    if (isNaN(form.askingPrice) || parseFloat(form.askingPrice) <= 0) {
      setError("Asking price must be a valid positive number");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(10);

      // Upload images to Cloudinary
      const imageUrls = await uploadImageToCloudinary();
      setUploadProgress(70);

      // Create item on backend (NO auction created here)
      const token = localStorage.getItem("token");
      const itemResponse = await fetch(`${API_BASE_URL}/items`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          image: imageUrls[0], // Main image is the first one
          images: imageUrls, // Store all images
          askingPrice: parseFloat(form.askingPrice),
          biddingDuration: parseInt(form.biddingDuration),
        }),
      });

      if (!itemResponse.ok) {
        throw new Error("Failed to create item");
      }

      setUploadProgress(100);
      setTimeout(() => {
        navigate("/home");
      }, 500);
    } catch (err) {
      setError(err.message || "Error uploading item");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2 className="upload-title">Sell Your Item</h2>
        <p className="upload-subtitle">
          Upload your item with details and set an auction
        </p>

        {error && <div className="upload-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Item Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Vintage Watch"
              value={form.title}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              placeholder="Describe your item in detail..."
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Furniture">Furniture</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Asking Price (₹) *</label>
              <input
                type="number"
                name="askingPrice"
                placeholder="0.00"
                value={form.askingPrice}
                onChange={handleChange}
                disabled={loading}
                min="1"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Bidding Duration *</label>
            <select
              name="biddingDuration"
              value={form.biddingDuration}
              onChange={handleChange}
              disabled={loading}
            >
              <option value={1}>1 Hour</option>
              <option value={6}>6 Hours</option>
              <option value={12}>12 Hours</option>
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours</option>
              <option value={72}>3 Days</option>
              <option value={168}>1 Week</option>
            </select>
          </div>

          <div className="form-group">
            <label>Upload Images * ({imageFiles.length} selected)</label>
            <div className="image-upload" onClick={triggerFileInput} style={{ cursor: "pointer" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                multiple
                style={{ display: "none" }}
              />
              <p className="upload-hint">
                {imageFiles.length === 0
                  ? "Click to select images"
                  : `${imageFiles.length} image(s) selected`}
              </p>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="image-previews-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="upload-button"
          >
            {loading
              ? `Uploading... ${uploadProgress}%`
              : "Create Auction"}
          </button>
        </form>
      </div>
    </div>
  );
}
