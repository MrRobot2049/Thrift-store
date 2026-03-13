import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoriesData } from './data/categories';
import './AdPostStyles.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const CLOUDINARY_UPLOAD_URL = process.env.REACT_APP_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;

const ItemView = () => {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();

  // Field states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [biddingDuration, setBiddingDuration] = useState(24); // default 24 hours

  // Upload and form states
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = React.useRef(null);

  // Finding category info for breadcrumb
  const categoryKey = Object.keys(categoriesData).find(
    (key) => categoriesData[key].id === categoryId
  );

  const formattedSubcategoryName = subcategoryId
    ? subcategoryId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  // --- Handlers ---
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Optional: limit to 12 photos
    const totalFiles = imageFiles.length + files.length;
    if (totalFiles > 12) {
      setError("You can only upload up to 12 photos.");
      return;
    }
    setError("");

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

      // Update progress proportionally
      setUploadProgress(30 + (i / imageFiles.length) * 40);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !adPrice || imageFiles.length === 0) {
      setError("Please fill all required fields and select at least one image");
      return;
    }

    if (isNaN(adPrice) || parseFloat(adPrice) <= 0) {
      setError("Asking price must be a valid positive number");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(10);

      // Upload images to Cloudinary
      const imageUrls = await uploadImageToCloudinary();
      setUploadProgress(70);

      const token = localStorage.getItem("token");
      const itemResponse = await fetch(`${API_BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          title: title,
          description: description,
          category: categoryKey || "Other", // Using top-level category mapping
          image: imageUrls[0], // Main image is the first one
          images: imageUrls, // Store all images
          askingPrice: parseFloat(adPrice),
          biddingDuration: parseInt(biddingDuration),
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
    <div className="ad-post-page">
      <header className="ad-header-top">
        <button className="back-arrow-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      </header>

      <div className="ad-main-content">
        <h1 className="ad-page-title">POST YOUR AD</h1>

        <div className="ad-form-container">
          {error && <div style={{ color: "red", padding: "10px 20px", background: "#ffe6e6", borderBottom: "1px solid red" }}>{error}</div>}

          {/* SECTION: CATEGORY */}
          <section className="form-section">
            <h2 className="section-title">SELECTED CATEGORY</h2>
            <div className="breadcrumb-box">
              <span className="breadcrumb-text">
                {categoryKey} {formattedSubcategoryName && `/ ${formattedSubcategoryName}`}
              </span>
              <button className="change-btn" onClick={() => navigate('/categories')}>
                Change
              </button>
            </div>
          </section>

          {/* SECTION: DETAILS */}
          <section className="form-section">
            <h2 className="section-title">INCLUDE SOME DETAILS</h2>

            <div className="input-group">
              <label htmlFor="adTitle">Ad title *</label>
              <input
                type="text"
                id="adTitle"
                className="text-input"
                maxLength={70}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
              <div className="input-footer">
                <span className="hint-text">Mention the key features of your item (e.g. brand, model, age, type)</span>
                <span className="char-count">{title.length} / 70</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="adDescription">Description *</label>
              <textarea
                id="adDescription"
                className="textarea-input"
                maxLength={4096}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
              <div className="input-footer">
                <span className="hint-text">Include condition, features and reason for selling</span>
                <span className="char-count">{description.length} / 4096</span>
              </div>
            </div>
          </section>

          {/* SECTION: AUCTION DETAILS */}
          <section className="form-section">
            <h2 className="section-title">AUCTION DETAILS</h2>

            <div className="input-group">
              <label htmlFor="adPrice">Start Bidding Price *</label>
              <div className="price-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input 
                  type="number" 
                  id="adPrice" 
                  className="price-input" 
                  value={adPrice}
                  onChange={(e) => setAdPrice(e.target.value)}
                  disabled={loading}
                  min="1"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="biddingDuration">Bidding Duration *</label>
              <select 
                id="biddingDuration" 
                className="select-input" 
                value={biddingDuration}
                onChange={(e) => setBiddingDuration(e.target.value)}
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
          </section>

          {/* SECTION: PHOTOS */}
          <section className="form-section">
            <h2 className="section-title">UPLOAD UP TO 12 PHOTOS</h2>
            <div className="photo-grid">
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                multiple
                style={{ display: "none" }}
              />

              {/* Render existing image previews */}
              {imagePreviews.map((preview, index) => (
                <div key={index} className="photo-box" style={{ position: "relative", padding: 0, overflow: "hidden" }}>
                  <img src={preview} alt={`preview ${index}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                  <button 
                    onClick={() => removeImage(index)}
                    style={{ position: "absolute", top: "5px", right: "5px", background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer" }}
                    disabled={loading}
                  >✕</button>
                </div>
              ))}

              {/* Active Add Photo box (only show if < 12 images) */}
              {imageFiles.length < 12 && (
                <div className="photo-box active-photo-box" onClick={triggerFileInput}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                    <line x1="12" y1="9" x2="12" y2="9.01"></line>
                    <line x1="16" y1="9" x2="16" y2="15"></line>
                    <line x1="13" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add Photo</span>
                </div>
              )}
              
              {/* Fill remaining boxes up to 12 slots for visual alignment */}
              {[...Array(Math.max(0, 11 - imageFiles.length))].map((_, i) => (
                <div key={`empty-${i}`} className="photo-box empty-photo-box" onClick={triggerFileInput}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                    <line x1="12" y1="9" x2="12" y2="9.01"></line>
                    <line x1="16" y1="9" x2="16" y2="15"></line>
                    <line x1="13" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
              ))}
            </div>
            {imageFiles.length === 0 && <p className="error-text">This field is mandatory</p>}
          </section>

          {/* SECTION: SUBMIT */}
          <section className="form-section submit-section">
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginBottom: "15px", width: "100%", background: "#e0e0e0", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ width: `${uploadProgress}%`, background: "#5c452e", padding: "5px", color: "white", textAlign: "right", fontSize: "12px", transition: "width 0.3s" }}>
                  {Math.round(uploadProgress)}%
                </div>
              </div>
            )}
            
            <button 
              className={`post-btn ${!loading && title && description && adPrice && imageFiles.length > 0 ? "active" : "disabled"}`}
              onClick={handleSubmit}
              disabled={loading}
              style={loading ? { cursor: "not-allowed", opacity: 0.7 } : {}}
            >
              {loading ? (uploadProgress > 0 ? `Uploading... ${Math.round(uploadProgress)}%` : "Processing...") : "Post now"}
            </button>
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="corporate-footer">
        <div className="footer-logos">
          <div className="logo-text">CarTrade Tech <span>GROUP</span></div>
          <div className="logo-divider"></div>
          <div className="logo-text">olx</div>
          <div className="logo-text">carwale</div>
          <div className="logo-text">bikewale</div>
          <div className="logo-text">CarTrade</div>
          <div className="logo-text">MOBILITY<br />OUTLOOK</div>
        </div>
        <div className="footer-bottom">
          <span className="sitemap-link">Sitemap</span>
          <span className="copyright">Free Classifieds in India . © 2006-2026 OLX</span>
        </div>
      </footer>
    </div>
  );
};

export default ItemView;
