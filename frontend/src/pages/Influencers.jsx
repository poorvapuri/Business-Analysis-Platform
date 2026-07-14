import { useState, useEffect } from 'react';
import { fetchInfluencers } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Filter, Award, CheckCircle, Smile } from 'lucide-react';

export default function Influencers() {
  const [city, setCity] = useState('');
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(cityFilter = city) {
    setLoading(true);
    try {
        const data = await fetchInfluencers(cityFilter);
        setInfluencers(data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  }

  const handleCityChange = (e) => {
      setCity(e.target.value);
  };

  const handleApplyFilter = () => {
      loadData(city);
  };

  // Find max score for relative visual bar sizing
  const maxScore = influencers.length > 0 ? influencers[0].influenceScore : 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="h2">Top Influencers</h1>
        
        <div className="flex items-center gap-2 card" style={{ padding: '0.5rem 1rem' }}>
            <Filter size={18} className="text-muted" />
            <input 
                type="text" 
                placeholder="Filter by city..." 
                className="form-input"
                style={{ backgroundColor: 'transparent', border: 'none', padding: '0.25rem', width: '200px' }}
                value={city}
                onChange={handleCityChange}
                onKeyDown={e => e.key === 'Enter' && handleApplyFilter()}
            />
            <button className="btn btn-primary" onClick={handleApplyFilter} style={{ padding: '0.25rem 0.75rem' }}>Apply</button>
        </div>
      </div>

      {/* Top 10 Bar Chart */}
      <div className="card mb-8">
          <h3 className="h4 mb-6">Influence Score Ranking</h3>
          <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={influencers.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="name" stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                        <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                        <Bar dataKey="influenceScore" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
          </div>
      </div>

      {/* Ranked Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
              <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Name</th>
                      <th>Reviews</th>
                      <th><span className="flex items-center" title="Useful"><CheckCircle size={14} className="mr-1"/> Useful</span></th>
                      <th><span className="flex items-center" title="Funny"><Smile size={14} className="mr-1"/> Funny</span></th>
                      <th>Status</th>
                      <th style={{ minWidth: '200px' }}>Score Bar</th>
                  </tr>
              </thead>
              <tbody>
                  {loading ? (
                      <tr><td colSpan="7" className="text-center py-4">Loading influencers...</td></tr>
                  ) : influencers.map((user, index) => (
                      <tr key={user.user_id}>
                          <td className="font-bold text-muted">{index + 1}</td>
                          <td className="font-bold">{user.name}</td>
                          <td>{user.review_count}</td>
                          <td>{user.useful}</td>
                          <td>{user.funny}</td>
                          <td>
                              {user.elite ? (
                                  <span className="badge flex items-center" style={{ width: 'fit-content', backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                                      <Award size={12} className="mr-1"/> Elite {user.elite.slice(0, 4)}
                                  </span>
                              ) : '-'}
                          </td>
                          <td>
                              <div className="flex items-center w-full">
                                  <div style={{ flexGrow: 1, height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                      <div 
                                        style={{ 
                                            width: `${(user.influenceScore / maxScore) * 100}%`,
                                            height: '100%',
                                            background: 'linear-gradient(to right, #f59e0b, #ef4444)'
                                        }} 
                                      />
                                  </div>
                                  <span className="ml-3 font-bold text-sm w-12 text-right">{Math.round(user.influenceScore)}</span>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
}
