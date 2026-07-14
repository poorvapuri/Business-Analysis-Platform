const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchOverview() {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return res.json();
}

export async function fetchMonthlyVolume(months = 12) {
    const res = await fetch(`${API_BASE}/analytics/monthly-volume?months=${months}`);
    return res.json();
}

export async function fetchTrending(days = 90) {
    const res = await fetch(`${API_BASE}/analytics/trending?days=${days}`);
    return res.json();
}

export async function fetchSentimentBreakdown(city = '') {
    const res = await fetch(`${API_BASE}/reviews/sentiment-breakdown?city=${city}`);
    return res.json();
}

export async function fetchBusinesses(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/businesses?${q}`);
    return res.json();
}

export async function fetchBusinessDetails(id) {
    const res = await fetch(`${API_BASE}/businesses/${id}`);
    return res.json();
}

export async function fetchBusinessReviews(id, page = 1) {
    const res = await fetch(`${API_BASE}/businesses/${id}/reviews?page=${page}`);
    return res.json();
}

export async function fetchCategoryBreakdown(city = '') {
    const res = await fetch(`${API_BASE}/analytics/category-breakdown?city=${city}`);
    return res.json();
}

export async function fetchStarsDistribution(city = '') {
    const res = await fetch(`${API_BASE}/analytics/stars-distribution?city=${city}`);
    return res.json();
}

export async function fetchInfluencers(city = '', limit = 20) {
  const res = await fetch(`${API_BASE}/users/top-influencers?city=${city}&limit=${limit}`);
  if (!res.ok) {
    const errText = await res.text();
    console.error('Failed to fetch influencers', res.status, errText);
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchCities() {
    const res = await fetch(`${API_BASE}/geo/cities`);
    return res.json();
}

export async function fetchNearby(params) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/geo/nearby?${q}`);
    return res.json();
}
