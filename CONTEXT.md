# YYZ Data Matrix E-Learning Platform — Complete Project Context

## 1. Project Overview & Domain
**YYZ Data Matrix Inc** (`https://yyzdm.ca` / `elearning-site-woad.vercel.app`) is an interactive E-Learning and Live Coaching platform based in Mississauga/Toronto, Ontario, Canada. It delivers practical, project-based Business Intelligence (BI) and Data Analytics training led by **Rauf Anwar** (MBA, CMA, CPA, PMP, Microsoft PL-300 Certified; 20+ years of enterprise finance & analytics experience).

### Learning Tracks
1. **Power BI Data Analyst (`powerbi`)** — *Fully implemented curriculum & pricing*:
   - **Module 1 (`module-1`)**: Power Query & Data Cleaning (ETL) — *"Data prep Engine"*
   - **Module 2 (`module-2`)**: Power Pivot, DAX, and Data Analytics — *"The Brain behind BI"*
   - **Module 3 (`module-3`)**: Data Visualization & Storytelling
   - **Module 4 (`module-4`)**: Data Modeling and Optimization
   - **Module 5 (`module-5`)**: Power BI Service & Publishing
   - **Module 6 (`module-6`)**: From Raw Data to Executive Dashboards
   - Includes downloadable sample project PDFs (`/docs/Historical Sales Report.pdf`, `/docs/Efficiency Report.pdf`) and a course demo video (`/videos/powerbi-demo.mp4`).
2. **SQL for Data Analysis (`sql`)** — Featured on Home page; syllabus & pricing marked *"Coming Soon"* on `/courses` and `/pricing`.
3. **MS Access Database Development (`access`)** — Featured on Home page; syllabus & pricing marked *"Coming Soon"*.
4. **Advanced Excel for Business Analysis (`excel`)** — Featured on Home page; syllabus & pricing marked *"Coming Soon"*.

### Enrollment Tiers
- **Self-Paced Video (`video`)**: Default `$499` full course bundle or `$99` per individual module.
- **Live Coaching (`live`)**: Default `$999` full course bundle or `$199` per individual module (includes 1-on-1 sessions, resume/portfolio review, instructor Q&A, plus video content).
- Rates are dynamically stored in Firestore (`courses/powerbi` and `courses/powerbi/sections/*`) and editable from the Admin Control Panel.

---

## 2. Technology Stack

### Core Frontend (`elearning-react/`)
- **Framework**: React 19 (`^19.2.8`) with Vite 8 (`^8.2.0`).
- **Routing**: React Router DOM v7 (`^7.18.2`).
- **Styling**: Pure Vanilla CSS (`src/index.css`, `src/pages.css`, and component/page-scoped `.css` files) using CSS Custom Properties (`--primary-color`, `--bg-main`, `--glass-bg`, etc.) and `body[data-theme="dark"]` for Light/Dark mode. **No TailwindCSS.**
- **Smooth Scrolling & Animations**:
  - `lenis` (`^1.3.26`) via `src/hooks/useSmoothScroll.js` (exposed globally on `window.lenis`).
  - `IntersectionObserver` + `MutationObserver` via `src/hooks/useScrollAnimation.js` (auto-applies `.animate-on-scroll` and `.animate-visible`).
  - HTML5 `<canvas>` Matrix digital rain background (`src/components/ParticleBackground.jsx`).
- **SEO & Analytics**:
  - `react-helmet-async` (`^3.0.0`) via `src/components/SEO.jsx` for title, meta description, Open Graph, Twitter cards, and canonical URLs.
  - `@vercel/analytics` (`^2.0.1`) integrated in `src/App.jsx`.
  - Static route pre-rendering (`scripts/prerender.js`) using Express + Puppeteer on postbuild (skipped automatically when `process.env.VERCEL` is set), paired with conditional `hydrateRoot` / `createRoot` in `src/main.jsx`.
- **Linting**: `oxlint` (`^1.75.0`) configured via `.oxlintrc.json`.

### Backend, Database & Third-Party Integrations
- **Firebase (`^12.17.1`, `src/firebase.js`)**:
  - **Firebase Authentication**: Email/Password and Google OAuth (`signInWithPopup` with `prompt: 'select_account'`).
  - **Cloud Firestore**: Real-time NoSQL database for users, courses, sections, subscriptions, transactions, scheduled sessions, live video rooms, support chats, notifications, ratings/reviews, and contact messages.
- **Stripe Payments (`stripe` `^23.0.0`, `@stripe/stripe-js` `^10.0.0`)**:
  - Hosted Stripe Checkout Sessions created via `POST /api/create-checkout-session`.
- **LiveKit Video Conferencing (`livekit-client`, `@livekit/components-react`, `livekit-server-sdk`)**:
  - Real-time embedded video/audio classrooms (`LiveKitRoom`, `VideoConference`, `RoomAudioRenderer`) powered by JWT tokens from `GET /api/livekit-token`.
- **Calendar & Scheduling**:
  - `react-big-calendar` (`^1.20.0`) + `date-fns` (`^4.4.0`) in `src/components/CalendarView.jsx`.
- **Phone Input**:
  - `react-phone-number-input` (`^3.4.17`) in `src/pages/Profile.jsx` (default country `CA`).

---

## 3. Repository & Directory Structure

```text
c:\Code\ELearning\
├── .agents/
│   └── AGENTS.md                        # Agent instructions & repository context
├── CONTEXT.md                           # Comprehensive project context documentation
├── README.md                            # Root project README
└── elearning-react/                     # Main Vite + React application root
    ├── api/                             # Vercel Serverless Functions (Production API)
    │   ├── create-checkout-session.js   # POST: Creates Stripe Checkout Session
    │   └── livekit-token.js             # GET: Generates LiveKit room JWT access token
    ├── public/                          # Static assets served at "/"
    │   ├── docs/                        # Sample Power BI PDF reports
    │   ├── icons/                       # Certification badges (powerbi-badge.webp)
    │   ├── images/                      # WebP images (light/dark variants) & modules/
    │   ├── videos/                      # Course demo video (powerbi-demo.mp4)
    │   ├── ads.txt                      # AdSense declaration
    │   ├── robots.txt                   # Search crawler directives
    │   └── sitemap.xml                  # Sitemap for https://yyzdm.ca
    ├── scripts/
    │   ├── convert_to_webp.py           # Python (Pillow) script to convert JPG/PNG -> WebP
    │   └── prerender.js                 # Node script (Express + Puppeteer) for static SEO HTML
    ├── src/
    │   ├── components/
    │   │   ├── AccessibilityWidget.jsx  # Floating a11y menu (text size, contrast, dyslexic font, links, greyscale)
    │   │   ├── AdminRoute.jsx           # Route guard: checks VITE_ADMIN_EMAILS + Firestore user doc
    │   │   ├── CalendarView.jsx         # Wrapper around react-big-calendar (month/week/day views)
    │   │   ├── ChatWidget.jsx           # Real-time support chat (User widget + Admin fixed sidebar)
    │   │   ├── Footer.jsx               # Site footer + dynamic package.json version display
    │   │   ├── GlobalLiveBanner.jsx     # Pulsing top banner alerting subscribed users of active live classes
    │   │   ├── Header.jsx               # Fixed top navbar, mobile drawer, theme toggle, notifications, profile
    │   │   ├── Layout.jsx               # Shared page shell (Header, GlobalLiveBanner, Outlet, ChatWidget, A11y, Footer)
    │   │   ├── Loader.jsx               # Animated spinner (inline or fullScreen)
    │   │   ├── NotificationDropdown.jsx # Real-time bell dropdown + Web Audio API chime (AudioContext)
    │   │   ├── ParticleBackground.jsx   # Fixed background canvas rendering theme-aware digital rain
    │   │   ├── PaymentModal.jsx         # Checkout modal initiating Stripe redirect
    │   │   ├── ProtectedRoute.jsx       # Route guard: verifies auth user + Firestore user doc existence
    │   │   ├── ReviewModal.jsx          # Modal for submitting 1-5 star ratings & private admin reviews
    │   │   ├── ScheduleModal.jsx        # Modal for requesting or scheduling calendar sessions
    │   │   ├── SEO.jsx                  # react-helmet-async metadata & OpenGraph wrapper
    │   │   └── StarRating.jsx           # Interactive or read-only 5-star display with half-star support
    │   ├── contexts/
    │   │   └── AuthContext.jsx          # Firebase auth provider + automatic Firestore user synchronization
    │   ├── hooks/
    │   │   ├── useScrollAnimation.js    # IntersectionObserver + MutationObserver scroll reveal hook
    │   │   └── useSmoothScroll.js       # Lenis smooth scrolling initialization hook
    │   ├── pages/
    │   │   ├── About.jsx                # Mission, instructor credentials, philosophy
    │   │   ├── AdminPanel.jsx           # 7-tab Admin Dashboard (Users, Pricing, Subscriptions, Calendar, Messages, Live Classes, Reviews)
    │   │   ├── Contact.jsx              # Contact info + Firestore contact form submission
    │   │   ├── Courses.jsx              # Main course catalog, syllabus accordions, ratings, schedule tab, Stripe return handler
    │   │   ├── Home.jsx                 # Landing page (Hero, tracks, project showcase, instructor bio, testimonials, platform comparison)
    │   │   ├── LiveClass.jsx            # Protected LiveKit video conference room (/live-class/:roomId)
    │   │   ├── NotFound.jsx             # 404 page
    │   │   ├── Pricing.jsx              # Dedicated pricing page (Full Course bundles + Individual Modules)
    │   │   ├── Privacy.jsx              # Privacy Policy page
    │   │   ├── Profile.jsx              # User profile completion form (/profile)
    │   │   ├── SignIn.jsx               # Email/Password & Google Sign-In page
    │   │   └── SignUp.jsx               # Account registration page
    │   ├── services/
    │   │   ├── chatService.js           # Firestore CRUD & onSnapshot listeners for chats & messages
    │   │   ├── courseService.js         # Firestore CRUD & initial seeding for courses & module sections
    │   │   ├── liveSessionService.js    # Firestore management for active LiveKit sessions (with 12h zombie filter)
    │   │   ├── ratingService.js         # Firestore composite-key rating & review service
    │   │   ├── scheduleService.js       # Firestore CRUD for calendar sessions + notification trigger
    │   │   └── subscriptionService.js   # Firestore CRUD for user subscriptions & payment transactions
    │   ├── App.jsx                      # Root router & global providers
    │   ├── firebase.js                  # Firebase app, Auth, GoogleAuthProvider, and Firestore initialization
    │   ├── index.css                    # Global design system, CSS variables, dark mode, responsive media queries
    │   ├── main.jsx                     # DOM entry point with hydration support
    │   └── pages.css                    # Shared styles for Contact, Auth, and Privacy pages
    ├── index.html                       # Root HTML with JSON-LD EducationalOrganization schema & GA tag
    ├── package.json                     # Dependencies and npm scripts
    ├── vercel.json                      # Vercel headers, legacy .html redirects, and SPA rewrite rules
    └── vite.config.js                   # Vite config + local dev server middleware for /api/* routes
```

---

## 4. Firestore Database Schema (`src/services/*`)

1. **`users/{uid}`** (Managed in `AuthContext.jsx`, `Profile.jsx`, `AdminPanel.jsx`)
   - `uid`: `string` (Firebase Auth UID)
   - `email`: `string`
   - `displayName`: `string`
   - `photoURL`: `string`
   - `createdAt`: `Timestamp`
   - `profileComplete`: `boolean` (initialized to `false`; set to `true` when user saves `/profile`)
   - `firstName`, `lastName`, `dob`, `phone`, `category` (`'Student' | 'Professional'`), `company`, `position`: `string` (populated via `Profile.jsx`)

2. **`courses/{courseId}`** (Managed in `courseService.js`)
   - Document IDs: e.g., `'powerbi'`
   - `title`: `string` (e.g., `'Microsoft Power BI'`)
   - `overallVideoRate`: `number` (default `499`)
   - `overallLiveRate`: `number` (default `999`)
   - **Subcollection `courses/{courseId}/sections/{sectionId}`**:
     - Document IDs: `'module-1'` through `'module-6'`
     - `id`: `string`
     - `title`: `string`
     - `videoRate`: `number` (default `99`)
     - `liveRate`: `number` (default `199`)
     - `videoLink`: `string`

3. **`subscriptions/{subId}`** (Managed in `subscriptionService.js`)
   - `userId`: `string`
   - `courseId`: `string` (`'powerbi'`, etc.)
   - `sectionId`: `string` (`'all'` for full course bundle, or `'module-1'`..`'module-6'`)
   - `type`: `'video' | 'live'`
   - `amount`: `number`
   - `status`: `'active' | 'completed'` (toggled by teachers/admins via `updateSubscriptionStatus` in `AdminPanel.jsx`)
   - `createdAt`: `Timestamp`
   - `completedAt`: `Timestamp | null` (set when marked `'completed'`)

4. **`transactions/{transId}`** (Managed in `subscriptionService.js`)
   - Created automatically alongside every subscription in `createSubscription()`.
   - `userId`: `string`
   - `subscriptionId`: `string`
   - `amount`: `number`
   - `paymentMethod`: `string` (`'stripe'`, `'admin_grant'`, etc.)
   - `date`: `Timestamp`

5. **`sessions/{sessionId}`** (Managed in `scheduleService.js`)
   - Scheduled calendar events for 1-on-1 or live coaching.
   - `userId`: `string`
   - `courseId`: `string`
   - `sectionId`: `string`
   - `title`: `string`
   - `startTime`: `Date | Timestamp`
   - `endTime`: `Date | Timestamp`
   - `meetingLink`: `string`
   - `createdAt`: `Timestamp`

6. **`liveSessions/{sessionId}`** (Managed in `liveSessionService.js`)
   - Real-time active LiveKit video classrooms.
   - `roomId`: `string` (`${courseId}-${sectionId}-live-${Date.now()}`)
   - `courseId`: `string` (Course ID like `'powerbi'`, or `'direct'` for 1-on-1 direct user sessions)
   - `sectionId`: `string` (`'all'`, `'module-1'`, etc., or target `userId` when `courseId === 'direct'`)
   - `title`: `string`
   - `isActive`: `boolean`
   - `startedAt`: `Date | Timestamp`
   - `endedAt`: `Date | Timestamp` (optional, set when ended)
   - `createdBy`: `string` (Admin UID)
   - *Note*: `subscribeToActiveSessions` automatically filters out zombie sessions older than 12 hours (`43,200,000` ms).

7. **`chats/{userId}` & Subcollection `chats/{userId}/messages/{messageId}`** (Managed in `chatService.js`)
   - Root doc `chats/{userId}` tracks conversation state:
     - `userId`: `string`
     - `userName`: `string`
     - `lastMessage`: `string`
     - `lastMessageAt`: `Timestamp`
     - `unreadByAdmin`: `boolean`
     - `unreadByUser`: `boolean`
   - Subcollection `messages/{messageId}`:
     - `senderId`: `string`
     - `text`: `string`
     - `createdAt`: `Timestamp`
     - `isAdmin`: `boolean`

8. **`notifications/{notifId}`** (Managed in `chatService.js`, `scheduleService.js`, `subscriptionService.js`, `Contact.jsx`, `NotificationDropdown.jsx`)
   - `userId`: `string` (specific user's `uid`, or `'admin'` for admin-targeted notifications)
   - `type`: `'chat' | 'session' | 'message' | 'completion'`
   - `title`: `string`
   - `message`: `string`
   - `read`: `boolean`
   - `createdAt`: `Timestamp`
   - `link`: `string` (`'/profile'`, `'/admin'`, `'/courses#powerbi'`, etc.)
   - `chatUserId`: `string` (optional, for chat notifications)

9. **`ratings/{ratingId}`** (Managed in `ratingService.js`)
   - Composite Document ID: `${userId}_${courseId}_${sectionId}` (ensures 1 rating per user per course/module).
   - `courseId`: `string`
   - `sectionId`: `string` (`'all'` for overall course rating, or `'module-1'`..`'module-6'`)
   - `userId`: `string`
   - `userName`: `string`
   - `rating`: `number` (1 to 5 stars; publicly aggregated on `/courses`)
   - `review`: `string` (written review text; **private to admins** and only displayed in Admin Panel > Course Reviews)
   - `updatedAt`: `Timestamp`

10. **`messages/{messageId}`** (Managed in `Contact.jsx` & `AdminPanel.jsx`)
    - Contact Us form submissions.
    - `name`, `email`, `subject`, `message`: `string`
    - `createdAt`: `Timestamp`
    - `read`: `boolean`

---

## 5. Key Architectural Flows

### 5.1 Authentication, Authorization & Profile Onboarding
- **`AuthContext.jsx`**: Listens to `onAuthStateChanged`. Whenever a user registers, signs in with email/password, or signs in with Google, `saveUserToFirestore()` ensures a document exists in `users/{uid}`.
- **Onboarding Redirect**: Upon login (`SignIn.jsx`) or registration (`SignUp.jsx`), if `firestoreUser.profileComplete` is falsy, the user is redirected to `/profile` (`Profile.jsx`) to complete their details (Name, DOB, Phone, Student/Professional status) before proceeding to `/courses`.
- **Route Guards**:
  - `ProtectedRoute.jsx` (wraps `/profile` and `/live-class/:roomId`): Verifies `user` is logged in AND `users/{uid}` exists in Firestore. If the Firestore doc was deleted by an admin, it forces `logout()` and redirects to `/signin`.
  - `AdminRoute.jsx` (wraps `/admin`): Verifies the user's email is in the comma-separated `import.meta.env.VITE_ADMIN_EMAILS` list AND their `users/{uid}` doc exists in Firestore. Redirects unauthorized users to `/courses`.

### 5.2 Course Subscriptions & Stripe Checkout Flow
1. User clicks a subscribe/enroll button on `/pricing` (`Pricing.jsx`) or `/courses` (`Courses.jsx`), opening `PaymentModal.jsx`.
2. `PaymentModal.jsx` sends `POST /api/create-checkout-session` with `{ courseId, sectionId, type, amount, title, userId }`.
3. Server creates a Stripe Checkout Session and returns `{ url: session.url }`. Browser redirects to Stripe.
4. Upon payment completion, Stripe redirects to:
   `/courses?payment=success&courseId=...&sectionId=...&type=...&amount=...` (or `/courses?payment=cancel`).
5. A `useEffect` in `Courses.jsx` (lines 155–199) intercepts `?payment=success`, clears the URL query params via `window.history.replaceState`, calls `createSubscription(..., 'stripe')` to write to `subscriptions` and `transactions` in Firestore, refreshes the user's subscriptions, and (if a single video module was purchased) opens `section.videoLink`.

### 5.3 Live Classes (LiveKit Video Conferencing)
1. **Starting a Class**: In `AdminPanel.jsx` -> **Live Classes** tab, an admin can start either:
   - A **Course Session** (`courseId` = e.g. `'powerbi'`, `sectionId` = `'all'` or `'module-X'`).
   - A **Direct User Session** (`courseId` = `'direct'`, `sectionId` = target `user.uid`).
2. `startLiveSession()` creates an active document in `liveSessions` and navigates the admin to `/live-class/:roomId`.
3. **Student Discovery**: `GlobalLiveBanner.jsx` and `NotificationDropdown.jsx` subscribe in real time (`subscribeToActiveSessions`) and check if the logged-in non-admin user has a matching subscription (or is the target of a `'direct'` session). If so, a pulsing `"LIVE NOW"` banner and notification appear with a **"Join Live Class"** button.
4. **Joining & Access Verification (`LiveClass.jsx`)**:
   - Verifies session is active and user is either an admin, the target of a direct session, or subscribed to the course/module.
   - Fetches a signed JWT from `GET /api/livekit-token?room=...&username=...&userId=...`.
   - Connects to `import.meta.env.VITE_LIVEKIT_URL` using `<LiveKitRoom>`.
   - Subscribes to the session document in Firestore; when the admin clicks **"End Class for Everyone"** (or disconnects), `isActive` becomes `false` and all connected students have their token cleared and are disconnected immediately.

### 5.4 Real-Time Support Chat & Notifications
- **Student View (`ChatWidget.jsx`)**: Floating bottom-right chat button (`#chat-toggle`). Streams messages from `chats/{user.uid}/messages`. Shows a red unread badge when the last message is from an admin while the window is closed.
- **Admin View (`ChatWidget.jsx`)**: Renders a toggleable right-hand fixed sidebar (`.admin-chat-sidebar-fixed`) listing all non-admin users sorted by `lastMessageAt`, with red/green status dots for `unreadByAdmin`, plus a chat window offset to `right: 310px`.
- **Notifications (`NotificationDropdown.jsx`)**: Subscribes to `notifications` where `userId == user.uid` (and `userId == 'admin'` if the user is an admin), merges in any active accessible LiveKit sessions, plays a synthesized Web Audio API chime (`AudioContext`) when unread count increases, and allows marking individual notifications as read or batch-deleting read notifications.

---

## 6. Environment Variables & Local vs. Production API

Create `c:\Code\ELearning\elearning-react\.env` with:

```env
# Firebase Client Configuration (exposed to Vite frontend)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Comma-separated Admin Emails (used by AdminRoute, Header, Courses, AdminPanel, ChatWidget, etc.)
VITE_ADMIN_EMAILS=admin@example.com,anotheradmin@example.com

# LiveKit Configuration
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# Stripe Server Configuration
STRIPE_SECRET_KEY=sk_...
```

### Dual API Architecture (`/api/*`)
- **In Production (Vercel)**: Handled by Vercel Serverless Functions in `elearning-react/api/create-checkout-session.js` and `elearning-react/api/livekit-token.js`.
- **In Local Development (`npm run dev`)**: Handled by the custom `livekit-api` Vite plugin middleware inside `elearning-react/vite.config.js`, which loads `.env` via `dotenv` and intercepts `/api/livekit-token` and `/api/create-checkout-session` directly on the Vite dev server.
- *Note*: `vite.config.js` also sets `"Cross-Origin-Opener-Policy": "same-origin-allow-popups"` so Firebase Google Sign-In popups work cleanly.

---

## 7. Design System & Behavioral Guidelines

1. **Git Commands**: Do NOT check `git status` (or run git inspection commands) unless the user explicitly asks you to.
2. **Vanilla CSS Only**: Never introduce TailwindCSS or CSS-in-JS libraries. Use the established CSS variables in `src/index.css`:
   - Light Mode (`:root`): `--primary-color: #2563eb`, `--primary-rgb: 37, 99, 235`, `--primary-dark: #1d4ed8`, `--secondary-color: #1e293b`, `--accent-color: #f59e0b`, `--text-main` / `--text-color: #334155`, `--text-light` / `--text-color-light: #64748b`, `--bg-main` / `--background: #ffffff`, `--bg-alt: #f8fafc`, `--border-color: rgba(0, 0, 0, 0.1)`, `--border-radius: 12px`.
   - Dark Mode (`[data-theme="dark"]` on `<body>`, which is the default in `index.html`): `--primary-color: #3b82f6`, `--primary-rgb: 59, 130, 246`, `--primary-dark: #60a5fa`, `--secondary-color: #f8fafc`, `--text-main` / `--text-color: #e2e8f0`, `--text-light` / `--text-color-light: #cbd5e1`, `--bg-main` / `--background: #0f172a`, `--bg-alt: #1e293b`, `--border-color: rgba(255, 255, 255, 0.1)`, `--border-radius: 12px`.
3. **Theme-Aware Assets**: Whenever displaying diagrams or screenshots that have light/dark variants, render both with `.show-light` and `.show-dark` utility classes. Use `.webp` images (`scripts/convert_to_webp.py`).
4. **Admin Emails Rule**: Any new admin email MUST be added to `VITE_ADMIN_EMAILS` in both local `.env` and Vercel Environment Variables before deploying (`vercel --prod`).
5. **Notable Implementation Details to Keep in Mind**:
   - In `Courses.jsx`, the `"Unlock Full Course"` button navigates to `/pricing#${activeTab}`. Enrolled students see an `"Enrolled"` badge while `status === 'active'` and a green `"Completed"` badge once the teacher marks their course/module complete. The `"Rate Module"` / `"Leave a Review"` buttons appear **only after** `isCompleted(sectionId)` is true, opening `<ReviewModal />` (mounted at the bottom of `Courses.jsx`) and refreshing `courseRatings` on submission.
   - In `AdminPanel.jsx`, the **Subscriptions** tab includes a `"+ Add Subscription"` button (`showAddSubscriptionModal`) to manually grant course/module access, a **Status** column (`Active` / `Completed`), and a `"Mark Complete"` / `"Mark Active"` toggle button (`handleToggleSubscriptionStatus`) that updates `subscriptions/{subId}` and sends a `'completion'` notification to the student. The **Form Submissions** tab displays the full `Message` column, and live support chat is handled via the floating `ChatWidget` admin sidebar.

