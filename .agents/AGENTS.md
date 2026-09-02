# YYZ Data Matrix E-Learning Platform Context

## Project Overview
This project is an E-Learning platform for **YYZ Data Matrix Inc**, focusing on Business Intelligence tracks such as Power BI, SQL, MS Access, and Excel. 

## Technology Stack
- **Frontend Framework**: React (bootstrapped with Vite).
- **Styling**: Vanilla CSS utilizing custom CSS variables (`--primary-color`, `--card-bg`, etc.) to support a robust Dark/Light mode toggle (`data-theme="dark"`). Focus on premium glassmorphism, subtle gradients, and micro-animations.
- **Backend/Database**: Firebase (Firebase Authentication with Google Sign-in, and Firestore for storing user profiles).
- **Deployment**: Vercel (`elearning-site-woad.vercel.app`).

## Core Architecture & Components
1. **Authentication (`src/contexts/AuthContext.jsx`)**: 
   - Manages Firebase auth state.
   - Automatically synchronizes authenticated users (especially Google Sign-in) into the Firestore `users` collection upon login to ensure route guards pass.
2. **Route Guards (`src/components/ProtectedRoute.jsx` & `AdminRoute.jsx`)**: 
   - Restricts access based on whether the user's document exists in Firestore.
   - `AdminRoute` specifically checks if the user's email matches the comma-separated list in the `VITE_ADMIN_EMAILS` environment variable.
3. **UI/UX Details**:
   - Includes a sleek, animated `<Loader />` for smooth routing and auth-state transitions.
   - The `<Header />` component handles responsive mobile navigation and theme toggling.
   - Course imagery (for Power BI modules) is statically generated and hosted in `public/images/modules/`.
4. **Admin Panel (`src/pages/AdminPanel.jsx`)**:
   - Secure dashboard where authorized admins can view all registered users and safely delete non-admin users from the platform. 

## Deployment Rules
- The Vercel CLI (`vercel --prod`) is used for live deployments.
- **Critical**: Any new admin emails MUST be added to the `VITE_ADMIN_EMAILS` environment variable both in the local `.env` file AND inside the Vercel Dashboard (Settings > Environment Variables) before deploying.
- Firebase Firestore Security Rules are set to restrict read/write access (users can only see their own profile, admins can see/delete all profiles).

## Behavioral Guidelines for Agents
- Do not use TailwindCSS; stick to the existing vanilla CSS system and established CSS variables in `index.css`.
- When updating UI, maintain the premium, high-tech aesthetic (glowing borders, smooth transitions).
- Always ensure new features respect both Light and Dark mode themes.
