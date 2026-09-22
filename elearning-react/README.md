# YYZ Data Matrix E-Learning Platform

An E-Learning platform for **YYZ Data Matrix Inc**, focusing on Business Intelligence tracks such as Power BI, SQL, MS Access, and Excel.

## 🚀 Technology Stack

- **Frontend Framework**: React (bootstrapped with Vite)
- **Styling**: Vanilla CSS utilizing custom CSS variables (`--primary-color`, `--card-bg`, etc.) to support a robust Dark/Light mode toggle.
- **Backend/Database**: Firebase (Firebase Authentication with Google Sign-in, and Firestore for storing user profiles).
- **Deployment**: Vercel

## ✨ Key Features

- **Authentication**: Firebase auth state management with Google Sign-in. Automatically synchronizes authenticated users into the Firestore `users` collection upon login.
- **Role-Based Route Guards**: 
  - Restricts access based on whether the user's document exists in Firestore.
  - `AdminRoute` specifically checks if the user's email matches the comma-separated list in the `VITE_ADMIN_EMAILS` environment variable.
- **Admin Panel**: Secure dashboard where authorized admins can view all registered users and safely delete non-admin users from the platform.
- **Dynamic Theming**: Premium glassmorphism, subtle gradients, micro-animations, and a fully functional Light/Dark mode (`data-theme="dark"`).
- **Responsive Design**: Mobile-first responsive layouts, interactive components, and falling matrix backgrounds.

## 🛠️ Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- NPM or Yarn
- Firebase project setup with Firestore and Authentication (Google Sign-In) enabled.

### Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase configuration and Admin emails:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_ADMIN_EMAILS=admin@example.com,anotheradmin@example.com
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 📦 Deployment

The project is configured for deployment on Vercel.

**Critical Deployment Rules:**
Any new admin emails MUST be added to the `VITE_ADMIN_EMAILS` environment variable both in the local `.env` file AND inside the Vercel Dashboard (Settings > Environment Variables) before deploying.

### Build for Production
```bash
npm run build
```
