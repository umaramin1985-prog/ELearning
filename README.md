# YYZ Data Matrix E-Learning Platform

An interactive E-Learning and Live Coaching platform for **YYZ Data Matrix Inc** (`https://yyzdm.ca`), focusing on practical, project-based Business Intelligence tracks including **Microsoft Power BI**, **SQL**, **MS Access**, and **Advanced Excel**.

## 🚀 Technology Stack

- **Frontend Framework**: React 19 + Vite 8, React Router DOM v7
- **Styling**: Pure Vanilla CSS (`src/index.css`, `src/pages.css`, and component/page stylesheets) utilizing custom CSS variables (`--primary-color`, `--bg-main`, `--card-bg`, `--glass-bg`, `--border-color`, etc.) to support a seamless Dark/Light mode toggle (`data-theme="dark"`).
- **Backend & Database**: Firebase v12 (Firebase Authentication with Email/Password & Google Sign-In Popup, plus Cloud Firestore for real-time data synchronization).
- **Payments**: Stripe Checkout (`stripe`, `@stripe/stripe-js`) via `/api/create-checkout-session`.
- **Live Video Classes**: LiveKit (`@livekit/components-react`, `livekit-client`, `livekit-server-sdk`) via `/api/livekit-token`.
- **Scheduling & UI Enhancements**: `react-big-calendar` + `date-fns` (coaching session scheduling), `lenis` (smooth scrolling), `react-phone-number-input` (profile phone field), `react-helmet-async` (SEO & OpenGraph metadata), `@vercel/analytics`.
- **Deployment**: Vercel (`vercel.json` + Serverless Functions in `elearning-react/api/`) with static route pre-rendering (`scripts/prerender.js`).

## ✨ Key Features

- **Authentication & Onboarding**: Firebase Auth with Email/Password and Google Sign-In. Automatically syncs users into Firestore `users/{uid}` and guides new users through profile completion (`/profile`).
- **Role-Based Route Guards**:
  - `ProtectedRoute` verifies both Firebase Authentication and Firestore user document existence (auto-signing out deleted accounts).
  - `AdminRoute` verifies that the authenticated user's email matches the comma-separated list in `VITE_ADMIN_EMAILS`.
- **Flexible Course Subscriptions, Practice Assignments, Shortcuts Guide & Stripe Checkout**:
  - Full Course bundles (`sectionId: 'all'`) and Individual Module (`module-1`..`module-6`) subscriptions across **Self-Paced Video** and **Live Coaching** tiers.
  - **Enrolled Module Assignments & Datasets**: Students enrolled in a course/module (via subscription or cohort) unlock downloadable hands-on assignment workbooks and databases from `elearning-react/public/docs/Assignments` inside Module 1 (*Power Query & Data Cleaning (ETL)*) and Module 2 (*Power Pivot, DAX, and Data Analytics*).
  - **Compiled Power BI Shortcuts & Data Model Checklist (`ShortcutDeck.jsx`)**: Searchable, tabbed text reference on `/courses` featuring 70 curated keyboard shortcuts across Power BI Desktop, Power Query, and DAX with one-click copy, plus a 6-stage Data Model Startup Checklist.
  - Dynamic pricing managed in Firestore and editable in real time from the Admin Control Panel.
- **Persistent Live Video Classes, Docked Mini-Player & Picture-in-Picture (LiveKit)**:
  - Admins can launch live video classrooms for any course/module, for a multi-student **Class Cohort**, or start 1-on-1 direct sessions for a specific student.
  - Subscribed and cohort students receive a real-time pulsing **"Join Live Class"** banner (`GlobalLiveBanner`) and notification alert.
  - Live calls stay connected across route changes and tab switches (`adaptiveStream: false`, `disconnectOnPageLeave: false`), dock into a bottom-left mini-player inside the app, and support OS-level Picture-in-Picture (PiP).
- **Multi-Student Classes (Cohorts / Batches)**:
  - Admins can group students into persistent classes (`classService.js`) to schedule group sessions, launch cohort LiveKit rooms, and grade/complete cohorts in bulk.
- **Real-Time Support Chat & Notifications**:
  - Floating support chat widget for students (`chats/{userId}/messages`) and a fixed multi-user live chat sidebar for admins.
  - Real-time notification bell (`NotificationDropdown`) with Web Audio API chime alerts.
- **Interactive Calendar, Course Completion, Grading & Certificates**:
  - Students and admins can schedule and manage individual or cohort coaching sessions on an interactive calendar (`sessions` collection).
  - Teachers/admins can mark a student's course/module enrollment or class cohort as **Completed** and assign a `0–100%` score, automatic letter grade (`A+`–`F`), and feedback (`gradeService.js`).
  - Students view grades under **My Grades** (`/courses#mygrades`), print/save an official **Certificate of Achievement**, and submit 1–5 star ratings and written reviews for completed courses/modules.
- **Grouped Admin Control Panel (`/admin`)**:
  - 8-tab management dashboard grouped into **Students & Cohorts** (`Users`, `Classes`, `Subscriptions`), **Teaching & Schedule** (`Calendar`, `Live Classes`), and **Catalog & Feedback** (`Course Pricing`, `Course Reviews`, `Form Submissions`).
- **Accessibility & Theming**:
  - Built-in `<AccessibilityWidget />` (Large Text, High Contrast, Dyslexia Friendly font, Highlight Links, Greyscale), Light/Dark mode persistence, and an HTML5 canvas Matrix background (`<ParticleBackground />`).

## 🛠️ Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- NPM
- Firebase project with Firestore and Authentication (Email/Password & Google Sign-In) enabled
- Stripe & LiveKit API credentials (for checkout and live video features)

### Setup

1. **Navigate to the React application directory and install dependencies:**
   ```bash
   cd elearning-react
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file inside `elearning-react/` with your Firebase, Admin, LiveKit, and Stripe credentials:
   ```env
   # Firebase Client Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Comma-separated Admin Emails
   VITE_ADMIN_EMAILS=admin@example.com,anotheradmin@example.com

   # LiveKit Video Conferencing
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret

   # Stripe Checkout
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`. (In local development, `/api/create-checkout-session` and `/api/livekit-token` are served directly by the custom middleware plugin in `vite.config.js`.)

4. **Linting:**
   ```bash
   npm run lint
   ```

## 📦 Deployment

The project is configured for deployment on **Vercel** (`elearning-react/`).

**Critical Deployment Rule:**
Any new admin emails MUST be added to the `VITE_ADMIN_EMAILS` environment variable both in the local `elearning-react/.env` file AND inside the Vercel Dashboard (Settings > Environment Variables) before deploying (`vercel --prod`).

### Build for Production
```bash
cd elearning-react
npm run build
```
