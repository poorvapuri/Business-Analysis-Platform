import { useState, useEffect } from 'react';
import { fetchOverview, fetchMonthlyVolume, fetchSentimentBreakdown, fetchTrending } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Store, MessageSquare, Users, Star, TrendingUp, TrendingDown } from 'lucide-react';

const SENTIMENT_COLORS = {
  Positive: '#10b981', // green
  Neutral: '#f59e0b', // orange
  Negative: '#ef4444' // red
};

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [sentiment, setSentiment] = useState([]);
  const [trending, setTrending] = useState({ topTrending: [], topDeclining: [] });
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    async function loadData() {
      try {
        const [ov, mv, sent, trend] = await Promise.all([
          fetchOverview(),
          fetchMonthlyVolume(),
          fetchSentimentBreakdown(),
          fetchTrending(90)
        ]);
        console.log('Sentiment data:', sent);
        setOverview(ov);
        setMonthly(mv);
        setSentiment(sent);
        setTrending(trend);
        
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading dashboard analytics...</div>;

  return (
    <div>
      <h1 className="h2 mb-8">Platform Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-muted mb-1 font-bold text-sm">TOTAL BUSINESSES</p>
            <h2 className="h2">{overview?.businesses?.toLocaleString()}</h2>
          </div>
          <div className="p-3" style={{backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: '50%'}}>
            <Store className="text-gradient" size={24} />
          </div>
        </div>
        
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-muted mb-1 font-bold text-sm">TOTAL REVIEWS</p>
            <h2 className="h2">{overview?.reviews?.toLocaleString()}</h2>
          </div>
          <div className="p-3" style={{backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: '50%'}}>
            <MessageSquare className="text-gradient" size={24} />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-muted mb-1 font-bold text-sm">TOTAL USERS</p>
            <h2 className="h2">{overview?.users?.toLocaleString()}</h2>
          </div>
          <div className="p-3" style={{backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: '50%'}}>
            <Users className="text-gradient" size={24} />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-muted mb-1 font-bold text-sm">AVERAGE RATING</p>
            <h2 className="h2">{overview?.averageStars?.toFixed(2)}</h2>
          </div>
          <div className="p-3" style={{backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '50%'}}>
            <Star color="#f59e0b" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Monthly Volume Line Chart */}
        <div className="card col-span-1">
          <h3 className="h4 mb-6">Review Volume (Past Year)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="reviewCount" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6, fill: '#8b5cf6' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Pie Chart */}
        <div className="card col-span-1">
          <h3 className="h4 mb-6">Overall Sentiment Breakdown</h3>
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentiment}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="sentiment"
                  stroke="none"
                >
                  {sentiment.map((entry, index) => {
                    return <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.sentiment] || '#ccc'} />;
                  })}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend inside pie area manually for nice aesthetic */}
            <div style={{ position: 'absolute', pointerEvents: 'none', textAlign: 'center' }}>
                <span className="text-muted" style={{display:'block'}}>Total Sentiments</span>
                <span className="h3 font-bold">{sentiment.reduce((a,b)=>a+Number(b.count),0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        {/* Trending List */}
      </div>

      {/* Trending List */}
      <div className="card">
        <h3 className="h4 mb-4">Trending Businesses (Last 90 Days vs Prior)</h3>
        <div className="grid grid-cols-2 gap-8">
            <div>
                <h4 className="font-bold text-accent-success mb-4 flex items-center"><TrendingUp className="mr-2"/> Fast Growers</h4>
                <ul style={{ listStyle: 'none' }}>
                    {trending.topTrending?.map((t, i) => (
                        <li key={i} className="flex justify-between items-center mb-3 pb-3 border-b border-[rgba(255,255,255,0.05)]">
                            <span>{t.business_name}</span>
                            <span className="badge badge-success">+{t.growth} reviews</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-accent-danger mb-4 flex items-center"><TrendingDown className="mr-2"/> Largest Declines</h4>
                <ul style={{ listStyle: 'none' }}>
                    {trending.topDeclining?.map((t, i) => (
                        <li key={i} className="flex justify-between items-center mb-3 pb-3 border-b border-[rgba(255,255,255,0.05)]">
                            <span>{t.business_name}</span>
                            <span className="badge badge-danger">{t.growth} reviews</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
}
