<div align="center">

# **NBK-YOUTH**

*Empowering Youth, Igniting Future Success*

<br/>

<img src="https://img.shields.io/badge/javascript-99.9%25-yellow?style=for-the-badge&logo=javascript" />
<img src="https://img.shields.io/badge/languages-3-blue?style=for-the-badge" />

</div>


<div align="center">

### *Built with the tools and technologies:*

<br/>

<img src="https://img.shields.io/badge/Express-black?style=for-the-badge&logo=express" />
<img src="https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json" />
<img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" />
<img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose" />
<img src="https://img.shields.io/badge/PostCSS-DD3A0A?style=for-the-badge&logo=postcss" />

<br/>

<img src="https://img.shields.io/badge/.ENV-yellow?style=for-the-badge" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" />
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge" />

</div>


---

**NBK-Youth** is a full-stack web application for the NBK Youth community. It features a React/Vite front-end and a Node.js/Express back-end. The platform provides user authentication (sign-up, sign-in, password reset), profile management, and multi-role access control (e.g. Developer, Admin, Financier). It also includes extensive content and data management capabilities, such as homepage slides and events, media “moments” (YouTube or uploaded), collections with sub-collections and songs, games with players, and committee member listings. Financial features cover payments and fundraising details, income and expense tracking (with CRUD operations and verification workflows), budgeting/estimation stats, and activity logs.  Additionally, NBK-Youth supports web push notifications (subscribe/unsubscribe/send) and a toggleable maintenance mode. (All API routes are mounted under `/api/*` in the Express server.) A live demo of the project is deployed at \[nbkyouth.vercel.app].

## Core Features

* **User Authentication & Profiles:** Sign-up, sign-in, password reset, and profile updates (including profile image upload/deletion) with role-based permissions (roles like Developer, Admin, Financier).
* **Financial Management:** Full payment processing and tracking (create, read, update, delete payments) with verification flows.  Income and expense management with detailed CRUD operations, approval/verification steps, and a recycle bin for deleted items.  Budgeting and estimation tools allow setting and adjusting projected incomes/expenses and viewing related statistics.
* **Content & Media Management:** Manage homepage content including slides and events (add/update/delete).  Create “moments” as featured media posts via YouTube links or file uploads, with options to pin or update titles.  Organize multimedia collections: create collections and sub-collections, and upload/update/delete songs within them.  Manage banner images/ads (create, activate, update, delete) with one active banner viewable by the public.
* **Interactive Features:** Organize games and tournaments – create games, add/update/delete players for each game, and remove games as needed.
* **Notifications & Utilities:** Web Push Notifications support (public key retrieval, client subscribe/unsubscribe, authenticated send, and notification history). Maintenance mode toggle endpoint to enable/disable a site-wide maintenance state. Activity logging captures admin/developer actions (with log viewing and stats for the developer role). Data export utilities on the front-end allow downloading reports in PDF or Excel (using libraries like jsPDF and XLSX).
* **Miscellaneous:** Hidden/protected user profiles (toggle visibility); multilingual UI support (e.g. Telugu and English); and default developer/admin setup on database initialization (via a setup utility run after DB connect).  The application is built as a Progressive Web App (PWA) for offline support (using Vite’s PWA plugin).

## Technologies Used

* **Frontend:** React (with [Vite](https://vitejs.dev/)), Tailwind CSS for styling, React Router for navigation, and \[vite-plugin-pwa] for Progressive Web App support. Additional libraries include Google Analytics integration (`react-ga4`), icons (Heroicons/Lucide), PDF/Excel export (`jspdf`, `jspdf-autotable`, `xlsx`), QR code generation, and toast notifications.
* **Backend:** Node.js with Express.js for the server, MongoDB (via Mongoose) for the database. Environment configuration with `dotenv`; security with JSON Web Tokens and bcrypt; file uploads via Cloudinary; Google APIs integration; email sending with Nodemailer; scheduled tasks with `node-cron`; and Web Push Notifications via `web-push`. CORS is enabled for cross-origin requests.
* **Hosting:** The project is deployed on Vercel (frontend) and render (backend) .

## Setup Instructions

**Prerequisites:** Install [Node.js (≥14.x)](https://nodejs.org/) and npm. Have access to a MongoDB database (local or cloud). (Obtain any required API keys/credentials for VAPID keys, Cloudinary, Google services, etc.)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Vineethkolli/NBK-Youth.git
   ```

2. **Backend Setup:**

   ```bash
   cd NBK-Youth/backend
   npm install
   ```

   Create a `.env` file in the `backend/` directory with at least the following variables:

   ```
   MONGODB_URI=your_mongodb_connection_string
   PUBLIC_VAPID_KEY=your_webpush_public_key
   PRIVATE_VAPID_KEY=your_webpush_private_key
   FRONTEND_URL=http://localhost:5173
   # (also include any needed JWT secret, Cloudinary creds, email credentials, etc.)
   ```

   Start the backend server:

   ```bash
   node server.js
   ```

   The server will run on port 5000 by default (view logs for the “Connected to MongoDB” message).

3. **Frontend Setup:**

   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

   This launches the Vite development server (default at [http://localhost:5173](http://localhost:5173)). Access this URL in your browser. You should see the NBK Youth sign-in page (in Telugu/English). The frontend will make API calls to the backend at the address specified by `FRONTEND_URL`.

4. **Environment Notes:** If running frontend and backend on different hosts or ports, update `FRONTEND_URL` in `.env` and the front-end API base URL accordingly (e.g. via Vite environment variables) to enable CORS.

## Usage

After starting both servers, navigate to the front-end URL (e.g. `http://localhost:5173`). From the UI, you can create a new account or sign in. Based on your role, you will have access to different features (e.g. an “Admin” or “Developer” user can manage slides, events, payments, etc.). The backend REST API endpoints (as listed in the routes) can also be accessed directly (e.g. `GET http://localhost:5000/api/auth/signin`, etc.) for testing.

For example, an authenticated request to fetch all stats might look like:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/stats
```

(This requires replacing `<token>` with a valid JWT obtained from signing in.) Refer to the source code controllers for exact API request formats and required fields.

## Contributing

Contributions and feedback are welcome! If you encounter issues or have feature requests, please open an issue on the [GitHub repository](https://github.com/Vineethkolli/NBK-Youth). Pull requests with bug fixes or enhancements can be submitted for review. Please follow standard GitHub workflow and code formatting (this project uses ESLint/TailwindCSS style).

## Credits / Contact

This project was developed by **Vineeth Kolli** (GitHub: [@Vineethkolli](https://github.com/Vineethkolli)). The live frontend is hosted at \[https://nbkyouth.vercel.app/].

## License

This project is licensed under the **ISC License**.

