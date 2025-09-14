VIDEO DEMO: https://youtu.be/7F43FYhVIDI


# Shopify-Analytics-Dashboard

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
[![Shopify](https://img.shields.io/badge/Shopify-7AB55C?style=for-the-badge&logo=shopify&logoColor=white)](#)

##  Overview

The Shopify Analytics Dashboard is a comprehensive, production-ready application designed to provide valuable business insights for your Shopify store. It features a beautiful, modern interface with real-time data analytics, interactive charts, and a responsive design that works across all devices. This multi-tenant application supports multiple Shopify stores with proper data isolation.

##  Key Features

### Backend

*   **Complete Shopify Data Ingestion:** Seamlessly pulls customer, order, and product data from the Shopify GraphQL API.
*   **Multi-Tenant Architecture:** Securely supports multiple Shopify stores with shop domain isolation.
*   **Robust Dashboard API:** Endpoints that deliver real-time data analytics.
*   **Comprehensive Error Handling:** Ensures data integrity and system reliability with robust error handling and data validation.

### Frontend

*   **Stunning User Interface:** A beautiful, animated full-screen login page with a modern glass morphism design.
*   **Real-Time Dashboard:** A comprehensive dashboard that displays key metrics in real-time.
*   **Interactive Visualizations:** Engaging charts and graphs for analyzing revenue trends, customer behavior, and order distributions.
*   **Fully Responsive:** A design that is optimized for all screen sizes, from desktops to mobile devices.
*   **Live API Integration:** All analytics are powered by actual Shopify data, with no mock data used.

### Highlights

*   **Real Data:** All analytics are derived from your actual Shopify data, which is securely stored in your own database.
*   **Modern UI:** Features sleek animations, gradients, and a professional design for a top-tier user experience.
*   **Full-Screen Experience:** An engaging, full-screen login page with captivating animations.
*   **Production Ready:** Built with error handling, loading states, and a responsive design to be deployed to production.

##  Tech Stack

*   **Frontend:** React
*   **Backend:** Node.js, Express
*   **Database:** Supabase
*   **API:** Shopify GraphQL API

##  Getting Started

### Prerequisites

*   Node.js
*   npm
*   A Shopify Partner Account
*   A Supabase Account

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/SanatKulkarni/Xeno-SanatKulkarni-Assignment.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd Xeno-SanatKulkarni-Assignment
    ```
3.  **Install backend dependencies:**
    ```sh
    cd backend
    npm install
    ```
4.  **Install frontend dependencies:**
    ```sh
    cd ../frontend
    npm install
    ```

### Configuration

1.  **Set up your Shopify App:**
    *   Create a new app in your Shopify Partner account.
    *   Obtain your Shopify API key and secret.
2.  **Set up your Supabase Project:**
    *   Create a new project on Supabase.
    *   Get your Supabase project URL and anon key.
3.  **Environment Variables:**
    *   Create a `.env` file in the `backend` directory and add the following:
        ```
        SHOPIFY_API_KEY=your_shopify_api_key
        SHOPIFY_API_SECRET=your_shopify_api_secret
        SUPABASE_URL=your_supabase_url
        SUPABASE_ANON_KEY=your_supabase_anon_key
        ```

### Running the Application

1.  **Start the backend server:**
    ```sh
    cd backend
    node server.js
    ```
2.  **Start the frontend development server:**
    ```sh
    cd ../frontend
    npm run dev
    ```
