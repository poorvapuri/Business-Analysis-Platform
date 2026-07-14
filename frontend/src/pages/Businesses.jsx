import { useState, useEffect } from 'react';
import { fetchBusinesses, fetchBusinessDetails, fetchBusinessReviews } from '../services/api';
import { Search, X, Star } from 'lucide-react';

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ city: '', category: '', minStars: '', minReviews: '' });
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [drawerDetails, setDrawerDetails] = useState(null);
  const [drawerReviews, setDrawerReviews] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, [page, filters]);

  async function loadBusinesses() {
    setLoading(true);
    try {
      const res = await fetchBusinesses({ ...filters, page, limit: 15 });
      setBusinesses(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to page 1 on filter change
  };

  const openDrawer = async (id) => {
    setSelectedBusiness(id);
    setDrawerLoading(true);
    try {
        const [details, reviewsData] = await Promise.all([
            fetchBusinessDetails(id),
            fetchBusinessReviews(id, 1) // Just first page of reviews for preview
        ]);
        setDrawerDetails(details);
        setDrawerReviews(reviewsData.data || []);
    } catch (err) {
        console.error(err);
    } finally {
        setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelectedBusiness(null);
    setDrawerDetails(null);
    setDrawerReviews([]);
  };

  return (
    <div style={{ position: 'relative' }}>
      <h1 className="h2 mb-8">Business Directory</h1>

      <div className="card mb-6 flex flex-wrap gap-4 items-end">
        <div style={{ minWidth: '220px' }}>
          <label className="text-sm text-muted">City</label>
          <input 
              type="text" 
              name="city" 
              placeholder="Filter by City (e.g. Las Vegas)..." 
              className="form-input"
              value={filters.city}
              onChange={handleFilterChange}
          />
        </div>
        <div style={{ minWidth: '220px' }}>
          <label className="text-sm text-muted">Category</label>
          <input 
              type="text" 
              name="category" 
              placeholder="Filter by Category (comma-separated)..." 
              className="form-input"
              value={filters.category}
              onChange={handleFilterChange}
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <label className="text-sm text-muted">Min Stars</label>
          <input 
              type="number" 
              name="minStars" 
              placeholder="Min Stars (1-5)" 
              className="form-input"
              min="1" max="5" step="0.5"
              value={filters.minStars}
              onChange={handleFilterChange}
              style={{ maxWidth: '150px' }}
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <label className="text-sm text-muted">Min Reviews</label>
          <input 
              type="number" 
              name="minReviews" 
              placeholder="Min Reviews" 
              className="form-input"
              min="0" step="1"
              value={filters.minReviews}
              onChange={handleFilterChange}
              style={{ maxWidth: '150px' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Categories</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
            ) : businesses.map(b => (
              <tr key={b.business_id} onClick={() => openDrawer(b.business_id)} style={{ cursor: 'pointer' }}>
                <td className="font-bold">{b.name}</td>
                <td>{b.city}</td>
                <td className="text-muted text-sm">{b.categories?.slice(0, 2).join(', ')}</td>
                <td>
                    <div className="flex items-center">
                        <Star size={16} className="text-accent-warning mr-1" fill="currentColor" /> {b.stars}
                    </div>
                </td>
                <td>{b.review_count}</td>
                <td>
                  <span className={`badge ${b.is_open ? 'badge-success' : 'badge-danger'}`}>
                    {b.is_open ? 'Open' : 'Closed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div className="flex justify-between items-center p-4 border-t border-[rgba(255,255,255,0.05)]">
            <span className="text-muted text-sm">Showing page {page} - Total results: {total}</span>
            <div className="flex gap-2">
                <button 
                    className="btn btn-outline" 
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </button>
                <button 
                    className="btn btn-outline" 
                    disabled={businesses.length < 15} 
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {selectedBusiness && (
          <div 
             style={{ 
                 position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                 backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 100 
             }}
             onClick={closeDrawer}
          >
              <div 
                 style={{ 
                     position: 'absolute', right: 0, top: 0, bottom: 0, width: '500px', 
                     backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)',
                     boxShadow: 'var(--shadow-lg)', padding: '2rem', overflowY: 'auto'
                 }}
                 onClick={e => e.stopPropagation()} // Prevent click from closing drawer
              >
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="h3">Business Details</h2>
                      <button onClick={closeDrawer} className="btn" style={{ background: 'transparent', padding: '0.25rem' }}>
                          <X color="var(--text-secondary)" />
                      </button>
                  </div>
                  
                  {drawerLoading ? (
                      <p>Loading details...</p>
                  ) : drawerDetails && (
                      <div>
                          <h1 className="h1 mb-2">{drawerDetails.name}</h1>
                          <p className="text-muted mb-4">{drawerDetails.address}, {drawerDetails.city}, {drawerDetails.state} {drawerDetails.postal_code}</p>
                          
                          <div className="flex gap-4 mb-6">
                            <span className="badge badge-warning flex items-center"><Star size={14} className="mr-1" fill="currentColor"/> {drawerDetails.stars} Rating</span>
                            <span className="badge badge-info">{drawerDetails.review_count} Reviews</span>
                          </div>

                          <div className="mb-6">
                              <h4 className="h4 mb-2">Categories</h4>
                              <div className="flex flex-wrap gap-2">
                                  {drawerDetails.categories.map(c => (
                                      <span key={c} className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>{c}</span>
                                  ))}
                              </div>
                          </div>

                          <div className="mb-8">
                              <h4 className="h4 mb-2">Recent Reviews</h4>
                              {drawerReviews.map(r => (
                                  <div key={r.review_id} className="card mb-3" style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)' }}>
                                      <div className="flex justify-between mb-2">
                                          <span className="font-bold">{r.user ? r.user.name : "Anonymous"}</span>
                                          <div className="flex text-accent-warning">
                                              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.stars ? "currentColor" : "none"} strokeWidth={i < r.stars ? 0 : 1} />)}
                                          </div>
                                      </div>
                                      <p className="text-sm text-muted">{r.date ? new Date(r.date).toLocaleDateString() : ''}</p>
                                      <p className="text-sm mt-2">{r.text}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
