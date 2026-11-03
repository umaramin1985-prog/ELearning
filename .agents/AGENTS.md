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
3. **Course Catalog, Assignments, Pricing & Stripe Checkout (`src/pages/Courses.jsx`, `Pricing.jsx`, `PaymentModal.jsx`, `public/docs/Assignments/`)**:
   - Supports **Full Course (`sectionId: 'all'`)** and **Individual Module (`module-1`..`module-6`)** subscriptions across two tiers: **Self-Paced Video (`video`)** and **Live Coaching (`live`)**.
   - **Enrolled Module Assignments (`public/docs/Assignments/`)**: Automatically discovered at build/dev time via `vite.config.js` (`globalThis.__ASSIGNMENT_FILES__`) and displayed exclusively to enrolled/completed students and admins inside the expanded module cards on `/courses`:
     - **Module 1 (`module-1` — *"Power Query & Data Cleaning (ETL)"*)**: Displays all files starting with `"Assignment"` (e.g., `Assignment No 01.07.zip`, `Assignment No 01.10.xlsx` .. `01.18.xlsx`).
     - **Module 2 (`module-2` — *"Power Pivot, DAX, and Data Analytics"*)**: Displays `"DAX Assignment"` files (`DAX Assignment.xlsx`).
   - `PaymentModal` posts to `/api/create-checkout-session` and redirects to Stripe Checkout.
   - Upon redirect back to `/courses?payment=success&...`, `Courses.jsx` records the subscription (`subscriptions` collection) and transaction (`transactions` collection) in Firestore.
4. **Live Video Classes, Docked Mini-Player & Picture-in-Picture (`src/pages/LiveClass.jsx`, `Layout.jsx`, `GlobalLiveBanner.jsx`, `liveSessionService.js`)**:
   - Admins can launch live video rooms for a course/module, for a multi-student **Class Cohort** (`courseId: 'class'`, `sectionId: classId`, `studentIds`), or directly for a specific user (`courseId: 'direct'`, `sectionId: userId`).
   - `GlobalLiveBanner` and `NotificationDropdown` listen to active `liveSessions` in real time (filtering out sessions older than 12 hours) and alert subscribed/cohort students with a pulsing **"Join Live Class"** banner.
   - `LiveClass.jsx` (`/live-class/:roomId`, persistently mounted via `Layout.jsx`) verifies subscription/cohort/admin access, fetches a JWT from `/api/livekit-token`, and mounts `<LiveKitRoom>` with `adaptiveStream: false` and `disconnectOnPageLeave: false` so calls never drop or pause when switching tabs/windows:
     - **Docked Corner Mini-Player**: Navigating to other pages on the website (`/courses`, `/admin`, etc.) or clicking **"Minimize"** docks the active video call into a floating bottom-left corner player with an **Expand** button.
     - **OS-Level Picture-in-Picture (PiP)**: Supports both one-click **"Floating Video (PiP)"** and automatic PiP (`autoPictureInPicture` / MediaSession `enterpictureinpicture`) so the live video floats on top of external desktop apps (Power BI, Excel, Access) and other browser tabs.
5. **Real-Time Support Chat & Notifications (`src/components/ChatWidget.jsx`, `NotificationDropdown.jsx`, `chatService.js`)**:
   - `ChatWidget` provides a floating support chat for logged-in students (`chats/{userId}/messages`) and a fixed right-hand user-list sidebar + chat window for admins.
   - `NotificationDropdown` streams user and `'admin'` notifications from Firestore `notifications`, plays a synthesized Web Audio API chime (`AudioContext`), and surfaces active live classes.
6. **Multi-Student Classes, Scheduling, Course Completion, Grading & Certificates (`classService.js`, `gradeService.js`, `scheduleService.js`, `subscriptionService.js`, `CalendarView.jsx`, `ScheduleModal.jsx`, `StarRating.jsx`, `ReviewModal.jsx`)**:
   - Admins can group multiple students into persistent **Classes / Cohorts** (`classService.js`, stored in the `classes` array on `courses/{courseId}`) to schedule group calendar sessions, launch cohort LiveKit classrooms, or grade/complete an entire class at once.
   - Students and admins can view/request/schedule sessions on an interactive calendar (`sessions` collection; class sessions create per-student linked docs with `batchGroupId` so student queries and admin master schedule deduplication both work seamlessly).
   - Teachers/admins can mark a student's course/module subscription or class cohort as `'completed'` (or reopen as `'active'`) and assign an official **Grade** (`score` `0–100%`, automatic `letterGrade` `A+`..`F`, and optional `remarks`, stored on `subscriptions/{subId}`).
   - Completing and grading a course/module keeps course materials accessible, displays `"Completed"` and `"Grade: <letter> (<score>%)"` badges on `/courses`, sends a `'completion'` notification, unlocks course/module ratings & reviews, and enables a **My Grades** tab (`/courses#mygrades`) with a printable **Certificate of Achievement**.
7. **Admin Control Panel (`src/pages/AdminPanel.jsx`)**:
   - Grouped 8-tab dashboard (`Students & Cohorts`: **Users**, **Classes**, **Subscriptions**; `Teaching & Schedule`: **Calendar**, **Live Classes**; `Catalog & Feedback`: **Course Pricing**, **Course Reviews**, **Form Submissions**) with live search/filtering, user profile details (`phone`, `category`, `company`, `position`), cohort management, and student grading.
8. **Global UI, Mobile Responsiveness & Accessibility (`Header.jsx`, `Footer.jsx`, `AccessibilityWidget.jsx`, `ParticleBackground.jsx`)**:
   - Fixed `<Header />` with active-route highlighting, responsive mobile drawer, Dark/Light theme persistence (`localStorage.getItem('theme')`), and notification bell.
   - `<AccessibilityWidget />` toggles body classes for Large Text, High Contrast, Dyslexia Friendly font, Highlight Links, and Greyscale.
   - `<ParticleBackground />` renders a theme-aware falling digital matrix background on an HTML5 canvas.

## 4. Firestore Collections Summary
- `users/{uid}`: User profiles (`firstName`, `lastName`, `dob`, `phone`, `category`, `company`, `position`) & `profileComplete` flag.
- `courses/{courseId}` & `courses/{courseId}/sections/{sectionId}`: Course & module pricing (`overallVideoRate`, `overallLiveRate`, `videoRate`, `liveRate`, `videoLink`) plus multi-student `classes` array (`id`, `name`, `courseId`, `sectionId`, `studentIds`, `status`).
- `subscriptions/{subId}` & `transactions/{transId}`: Active/completed enrollments (`status: 'active' | 'completed'`, plus official grading fields `score`, `letterGrade`, `remarks`, `gradedAt`) and payment logs.
- `sessions/{sessionId}`: Scheduled calendar coaching sessions (individual and `batchGroupId`-linked class sessions).
- `liveSessions/{sessionId}`: Active LiveKit classroom state (`roomId`, `isActive`, `startedAt`, plus optional `classId`, `className`, `studentIds`).
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
