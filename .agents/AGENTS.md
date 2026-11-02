# YYZ Data Matrix E-Learning Platform Context

## 1. Project Overview & Domain
This project is an interactive E-Learning and Live Coaching platform for **YYZ Data Matrix Inc** (`https://yyzdm.ca` / `elearning-site-woad.vercel.app`), based in Mississauga/Toronto, ON, Canada. It focuses on practical, project-based Business Intelligence tracks led by **Rauf Anwar** (MBA, CMA, CPA, PMP, PL-300 Certified):
- **Power BI (`powerbi`)**: Full 6-module curriculum (`module-1` to `module-6`), sample PDF reports, demo video, and dynamic bundle/module pricing.
- **SQL (`sql`)**, **MS Access (`access`)**, and **Advanced Excel (`excel`)**: Featured on the landing page; syllabus and pricing tabs currently display *"Coming Soon"* placeholders.

## 2. Technology Stack
- **Frontend Framework**: React 19 (`^19.2.8`) + Vite 8 (`^8.2.0`), React Router DOM v7 (`^7.18.2`).
- **Styling**: Pure Vanilla CSS (`src/index.css`, `src/pages.css`, and page/component CSS files) utilizing custom CSS variables (`--primary-color`, `--bg-main`, `--card-bg`, `--glass-bg`, etc.) and `body[data-theme="dark"]` for Dark/Light mode toggling. Focus on glassmorphism, subtle gradients, and micro-animations.
- **Backend / Database**: Firebase v12 (`src/firebase.js` — Firebase Authentication with Email/Password & Google Sign-In Popup, plus Cloud Firestore).
- **Payments**: Stripe Checkout (`stripe`, `@stripe/stripe-js`) via `/api/create-checkout-session`.
- **Live Video Classes**: LiveKit (`@livekit/components-react`, `livekit-client`, `livekit-server-sdk`) via `/api/livekit-token`.
- **Scheduling & UI Libraries**: `react-big-calendar` + `date-fns` (calendar scheduling), `lenis` (smooth scrolling), `react-phone-number-input` (profile phone field), `react-helmet-async` (SEO), `@vercel/analytics`.
- **Deployment**: Vercel (`vercel.json` + `api/` serverless functions) and static route pre-rendering (`scripts/prerender.js` via Express + Puppeteer).

## 3. Core Architecture, Pages & Components
1. **Authentication & Onboarding (`src/contexts/AuthContext.jsx`, `SignIn.jsx`, `SignUp.jsx`, `Profile.jsx`)**:
   - Manages Firebase Auth state and automatically syncs every user into Firestore `users/{uid}` upon sign-up, login, or auth state change.
   - New users have `profileComplete: false` and are redirected to `/profile` upon login/registration to complete their personal/professional info.
2. **Route Guards (`src/components/ProtectedRoute.jsx` & `AdminRoute.jsx`)**:
   - `ProtectedRoute` (protects `/profile` and `/live-class/:roomId`): Restricts access based on whether the authenticated user's `users/{uid}` document exists in Firestore (auto-logs out deleted users).
   - `AdminRoute` (protects `/admin`): Checks that the user's email matches the comma-separated list in `import.meta.env.VITE_ADMIN_EMAILS` and that their Firestore user document exists.
3. **Course Catalog, Pricing & Stripe Checkout (`src/pages/Courses.jsx`, `Pricing.jsx`, `PaymentModal.jsx`)**:
   - Supports **Full Course (`sectionId: 'all'`)** and **Individual Module (`module-1`..`module-6`)** subscriptions across two tiers: **Self-Paced Video (`video`)** and **Live Coaching (`live`)**.
   - `PaymentModal` posts to `/api/create-checkout-session` and redirects to Stripe Checkout.
   - Upon redirect back to `/courses?payment=success&...`, `Courses.jsx` records the subscription (`subscriptions` collection) and transaction (`transactions` collection) in Firestore.
4. **Live Video Classes (`src/pages/LiveClass.jsx`, `GlobalLiveBanner.jsx`, `liveSessionService.js`)**:
   - Admins can launch live video rooms for a course/module or directly for a specific user (`courseId: 'direct'`, `sectionId: userId`).
   - `GlobalLiveBanner` and `NotificationDropdown` listen to active `liveSessions` in real time (filtering out sessions older than 12 hours) and alert subscribed students with a pulsing **"Join Live Class"** banner.
   - `LiveClass.jsx` (`/live-class/:roomId`) verifies subscription/admin access, fetches a JWT from `/api/livekit-token`, and mounts `<LiveKitRoom>`.
5. **Real-Time Support Chat & Notifications (`src/components/ChatWidget.jsx`, `NotificationDropdown.jsx`, `chatService.js`)**:
   - `ChatWidget` provides a floating support chat for logged-in students (`chats/{userId}/messages`) and a fixed right-hand user-list sidebar + chat window for admins.
   - `NotificationDropdown` streams user and `'admin'` notifications from Firestore `notifications`, plays a synthesized Web Audio API chime (`AudioContext`), and surfaces active live classes.
6. **Scheduling, Course Completion & Ratings (`CalendarView.jsx`, `ScheduleModal.jsx`, `StarRating.jsx`, `ReviewModal.jsx`, `subscriptionService.js`)**:
   - Students and admins can view/request/schedule sessions on an interactive calendar (`sessions` collection).
   - Teachers/admins can mark a student's course or module subscription as `'completed'` (or reopen as `'active'`) in the Admin Panel, which keeps course materials accessible, displays a `"Completed"` badge on `/courses`, sends a `'completion'` notification to the student, and unlocks the ability to rate/review.
   - Students whose course/module is marked `'completed'` can rate courses/modules (1–5 stars publicly aggregated, with private written feedback visible only to admins in `ratings/{userId}_{courseId}_{sectionId}`).
7. **Admin Control Panel (`src/pages/AdminPanel.jsx`)**:
   - Multi-tab dashboard for authorized admins: **Users** (view/delete non-admin users), **Course Pricing** (edit full-course and module rates in Firestore), **Subscriptions** (view revenue/subscriptions, manually grant or delete subscriptions, and toggle student course/module status between `Active` and `Completed`), **Calendar** (master schedule management), **Form Submissions** (view/delete `/contact` messages), **Live Classes** (start course or 1-on-1 LiveKit sessions, cleanup zombie sessions), and **Course Reviews** (read student ratings & private reviews).
8. **Global UI & Accessibility (`Header.jsx`, `Footer.jsx`, `AccessibilityWidget.jsx`, `ParticleBackground.jsx`)**:
   - Fixed `<Header />` with responsive mobile drawer, Dark/Light theme persistence (`localStorage.getItem('theme')`), and notification bell.
   - `<AccessibilityWidget />` toggles body classes for Large Text, High Contrast, Dyslexia Friendly font, Highlight Links, and Greyscale.
   - `<ParticleBackground />` renders a theme-aware falling digital matrix background on an HTML5 canvas.

## 4. Firestore Collections Summary
- `users/{uid}`: User profiles & `profileComplete` flag.
- `courses/{courseId}` & `courses/{courseId}/sections/{sectionId}`: Course & module pricing (`overallVideoRate`, `overallLiveRate`, `videoRate`, `liveRate`, `videoLink`).
- `subscriptions/{subId}` & `transactions/{transId}`: Active enrollments and payment logs.
- `sessions/{sessionId}`: Scheduled calendar coaching sessions.
- `liveSessions/{sessionId}`: Active LiveKit classroom state (`roomId`, `isActive`, `startedAt`).
- `chats/{userId}` & `chats/{userId}/messages/{msgId}`: Real-time 1-on-1 support chat threads.
- `notifications/{notifId}`: Real-time alerts for users (`userId: uid`) and admins (`userId: 'admin'`).
- `ratings/{userId}_{courseId}_{sectionId}`: Star ratings and admin-private written reviews.
- `messages/{msgId}`: Contact page form submissions.

## 5. Environment & Deployment Rules
- **Environment Variables (`elearning-react/.env` & Vercel Dashboard)**:
  - Client: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_ADMIN_EMAILS`, `VITE_LIVEKIT_URL`.
  - Server/API: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `STRIPE_SECRET_KEY`.
- **Local vs. Prod API**: In production on Vercel, `/api/create-checkout-session` and `/api/livekit-token` run as Serverless Functions from `elearning-react/api/`. In local development (`npm run dev`), they are served by the custom `livekit-api` middleware plugin inside `elearning-react/vite.config.js`.
- **Critical Admin Rule**: Any new admin emails MUST be added to `VITE_ADMIN_EMAILS` both in the local `.env` file AND inside the Vercel Dashboard (Settings > Environment Variables) before deploying (`vercel --prod`).

## 6. Behavioral Guidelines for Agents
- **Git Commands**: Do NOT check `git status` (or run git inspection commands) unless the user explicitly asks you to.
- **No TailwindCSS**: Stick strictly to the existing vanilla CSS system and established CSS variables in `src/index.css`.
- **Theme Support**: Always ensure new UI components respect both Light (`:root`) and Dark (`[data-theme="dark"]`) mode themes, and use `.show-light` / `.show-dark` for theme-specific imagery.
- **Asset Optimization**: Host static course/module imagery in `.webp` format under `public/images/` (using `scripts/convert_to_webp.py` when adding new raster images).
