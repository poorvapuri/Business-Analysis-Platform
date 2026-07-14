import { useState, useEffect } from 'react';
import { fetchNearby } from '../services/api';
import { MapPin, Navigation, Star, Store, Code } from 'lucide-react';

const PRESETS = [
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
  { name: 'Las Vegas', lat: 36.1699, lng: -115.1398 },
  { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
  { name: 'Charlotte', lat: 35.2271, lng: -80.8431 },
  { name: 'Pittsburgh', lat: 40.4406, lng: -79.9959 }
];

export default function GeoSearch() {
  const [params, setParams] = useState({ lat: '', lng: '', radius: 5000, category: '', minStars: '' });
  const [results, setResults] = useState([]);
  const [sqlQuery, setSqlQuery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalPages = Math.ceil(results.length / limit) || 1;
  const paginatedResults = results.slice((page - 1) * limit, page * limit);
  useEffect(() => { setPage(1); }, [results]);

  const handleParamChange = (e) => {
      const { name, value } = e.target;
      setParams(prev => ({ ...prev, [name]: value }));
  };

  const handlePreset = (preset) => {
      setParams(prev => ({ ...prev, lat: preset.lat, lng: preset.lng }));
  };

  const handleSearch = async () => {
      if (!params.lat || !params.lng) return alert("Latitude and Longitude are required.");
      setLoading(true);
      try {
          const res = await fetchNearby(params);
          setResults(res.data || []);
          setSqlQuery(res.queryExecuted);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div>
      <h1 className="h2 mb-8">Geospatial Search ($nearSphere)</h1>

      <div className="grid grid-cols-3 gap-8">
          {/* Controls Side */}
          <div className="col-span-1">
              <div className="card mb-6">
                  <h3 className="h4 mb-4 border-b border-[rgba(255,255,255,0.05)] pb-2 flex items-center">
                      <Navigation className="mr-2" size={18}/> City Presets
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                      {PRESETS.map(p => (
                          <button 
                            key={p.name} 
                            onClick={() => handlePreset(p)}
                            className="btn btn-outline text-sm"
                            style={{ padding: '0.25rem 0.5rem' }}
                          >
                              {p.name}
                          </button>
                      ))}
                  </div>

                  <h3 className="h4 mb-4 mt-6 border-b border-[rgba(255,255,255,0.05)] pb-2 flex items-center">
                      <MapPin className="mr-2" size={18}/> Search Parameters
                  </h3>
                  
                  <div className="mb-4">
                      <label className="block text-sm text-muted mb-1">Latitude</label>
                      <input type="number" name="lat" className="form-input" value={params.lat} onChange={handleParamChange} />
                  </div>
                  <div className="mb-4">
                      <label className="block text-sm text-muted mb-1">Longitude</label>
                      <input type="number" name="lng" className="form-input" value={params.lng} onChange={handleParamChange} />
                  </div>
                  <div className="mb-4">
                      <label className="block text-sm text-muted mb-1">Radius (meters)</label>
                      <input type="number" name="radius" className="form-input" value={params.radius} onChange={handleParamChange} step="1000" />
                  </div>
                  <div className="mb-4">
                      <label className="block text-sm text-muted mb-1">Category Filter</label>
                      <input type="text" name="category" className="form-input" value={params.category} onChange={handleParamChange} placeholder="e.g. Restaurants" />
                  </div>
                  <div className="mb-6">
                      <label className="block text-sm text-muted mb-1">Min Stars</label>
                      <input type="number" name="minStars" className="form-input" value={params.minStars} onChange={handleParamChange} min="1" max="5" step="0.5" />
                  </div>

                  <button className="btn btn-primary w-full" onClick={handleSearch} disabled={loading}>
                      {loading ? 'Searching...' : 'Execute Geo Search'}
                  </button>
              </div>

              {/* SQL Query Preview */}
              <div className="card" style={{ backgroundColor: '#000', border: '1px solid #1f2937', maxWidth: '100%', overflowX: 'auto' }}>
                  <h3 className="h4 mb-4 text-accent-success flex items-center">
                      <Code className="mr-2" size={18}/> PostgreSQL Query Preview
                  </h3>
                  {sqlQuery ? (
                      <pre style={{ margin: 0, padding: '1rem', backgroundColor: '#111827', borderRadius: '4px', overflowX: 'auto', fontSize: '13px', color: '#a78bfa' }}>
{sqlQuery}
                      </pre>
                  ) : (
                      <p className="text-muted text-sm italic">Run a search to see the generated SQL query.</p>
                  )}
              </div>
          </div>

          {/* Results Side */}
          <div className="col-span-2">
              <div className="card h-full">
                  <h3 className="h4 mb-6">Nearby Businesses ({results.length} found)</h3>
                  
                  {loading ? (
                      <div>Searching the index...</div>
                  ) : results.length === 0 ? (
                      <div className="text-center text-muted mt-12 py-12 border border-dashed border-[rgba(255,255,255,0.1)] rounded">
                          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                          <p>No businesses found using these coordinates.</p>
                          <p className="text-sm mt-2">Try a city preset or increase the search radius.</p>
                      </div>
                  ) : (
                      <>
                        <div className="grid gap-4">
                          {paginatedResults.map(b => (
                              <div key={b.business_id} className="p-4 rounded border border-[rgba(255,255,255,0.05)] bg-bg-primary flex justify-between items-start hover:border-accent-primary transition-colors">
                                  <div>
                                      <h4 className="font-bold h4 mb-1 flex items-center">
                                          <Store size={16} className="text-accent-primary mr-2"/> {b.name}
                                      </h4>
                                      <p className="text-sm text-muted mb-2">{b.address}, {b.city}</p>
                                      <div className="flex gap-2 text-xs">
                                          {b.categories?.slice(0, 3).map(c => (
                                              <span key={c} className="bg-bg-tertiary px-2 py-1 rounded">{c}</span>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="flex justify-end items-center mb-1">
                                          <Star size={16} fill="currentColor" className="text-accent-warning mr-1"/>
                                          <span className="font-bold text-lg">{b.stars}</span>
                                      </div>
                                      <span className="text-muted text-sm">{b.review_count} reviews</span>
                                      <p className="text-xs text-accent-success object-right mt-2">Within radius</p>
                                  </div>
                              </div>
                          ))}
                        </div>
                        {/* Pagination Controls */}
                        <div className="flex justify-center items-center mt-4 gap-4">
                            <button className="btn btn-outline" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Prev</button>
                            <span>Page {page} of {totalPages}</span>
                            <button className="btn btn-outline" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Next</button>
                        </div>
                      </>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
