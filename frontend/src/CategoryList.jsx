import React from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesData } from './data/categories';
import './CategoryStyles.css';

const CategoryList = () => {
  const navigate = useNavigate();

  return (
    <div className="category-page">
      <header className="category-header">
        <button onClick={() => navigate('/home')} className="back-button" style={{ borderRadius: '8px', padding: '6px 14px', gap: '6px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span style={{ fontWeight: '600', fontSize: '15px' }}>Back</span>
        </button>
        <h1 className="header-title" style={{ marginLeft: '1rem' }}>Home Categories</h1>
      </header>
      
      <main className="category-main">
        <div className="category-container">
          <h2 className="category-title">CHOOSE A CATEGORY</h2>
          <ul className="category-list">
            {Object.keys(categoriesData).map((key) => {
              const cat = categoriesData[key];
              return (
                <li 
                  key={cat.id} 
                  className="category-item" 
                  onClick={() => navigate(`/category/${cat.id}`)}
                >
                  <div className="category-item-content">
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{key}</span>
                  </div>
                  <span className="category-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default CategoryList;
