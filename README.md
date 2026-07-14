# Business Analytics Platform (ReviewLens)

A full-stack web application designed to analyze and visualize business data, customer reviews, and influencer metrics. Originally based on the Yelp dataset, this platform provides actionable insights through a modern, responsive dashboard.

## 🚀 Features

*   **Analytics Dashboard:** Visualizes review volumes over time and provides a sentiment breakdown (Positive, Neutral, Negative) using interactive charts.
*   **Influencer Tracking:** Identifies top reviewers (influencers) based on a custom influence score calculated from their review activity and fan base.
*   **Geospatial Search:** Allows users to find businesses based on their location (latitude/longitude), radius, category, and minimum star rating.
*   **Business Insights:** Detailed views for specific businesses, including average ratings, review counts, and operational hours.

## 🛠️ Technology Stack

*   **Frontend:** React 19, Vite, React Router DOM, Recharts, Lucide React.
*   **Backend:** Node.js, Express.js.
*   **Database:** PostgreSQL.
*   **Styling:** Custom CSS with a modern dark theme and dynamic design aesthetics.

## 📂 Project Structure

*   `/frontend`: Contains the React application (Vite setup).
    *   `src/pages`: Main application views (`Dashboard.jsx`, `Influencers.jsx`, `GeoSearch.jsx`, `Analytics.jsx`).
    *   `src/services`: API integration (`api.js`).
*   `/backend`: Contains the Express server and API routes.
    *   `routes`: API endpoints (`analytics.js`, `businesses.js`, `geo.js`, `reviews.js`, `users.js`).
    *   `db`: Database connection logic (`postgres.js`).
    *   `scripts`: Utilities for seeding and importing the Yelp dataset (`importYelp.js`, `seed.js`).
    *   `schema.sql`: PostgreSQL database schema definitions.

## ⚙️ Setup and Installation

### Prerequisites
*   Node.js (v18 or higher recommended)
*   PostgreSQL database

### 1. Database Configuration
1.  Create a PostgreSQL database.
2.  Run the `backend/schema.sql` script to create the necessary tables (`businesses`, `users`, `reviews`).
3.  Create a `.env` file in the `backend` directory and add your connection string:
    ```env
    DATABASE_URL=postgres://username:password@localhost:5432/your_db_name
    PORT=5000
    ```

### 2. Backend Setup
```bash
cd backend
npm install
# Starts the server using nodemon on port 5000
npx nodemon server.js 
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Starts the Vite development server
npm run dev 
```

## 📊 Data Import

The application includes scripts to import data from the Yelp Academic Dataset (JSON format).
1. Ensure your backend `.env` contains the path to the dataset: `YELP_DATA_DIR=/path/to/dataset`
2. Run the import script:
   ```bash
   cd backend
   node scripts/importYelp.js
   ```
