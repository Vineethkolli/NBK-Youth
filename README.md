<div align="center">

# 🌟 **NBK-YOUTH**  
### *Empowering Youth, Celebrating Unity and Joy*

**NBK YOUTH WEB APP** — *Started on OCT 2024*

<br/>
</div>

---

<div align="center">

### 🛠️ *Built with Modern Tools & Technologies*

<br/>

<!-- Row 1 -->
<img src="https://img.shields.io/badge/Express-black?style=for-the-badge&logo=express" />
<img src="https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json" />
<img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" />
<img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose" />
<img src="https://img.shields.io/badge/PostCSS-DD3A0A?style=for-the-badge&logo=postcss" />

<!-- Row 2 -->
<br/>
<img src="https://img.shields.io/badge/.ENV-yellow?style=for-the-badge" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" />
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge" />

<!-- Row 3 -->
<br/>
<img src="https://img.shields.io/badge/Vini_AI-purple?style=for-the-badge&logo=ai" />
<img src="https://img.shields.io/badge/Gemini_API-4285F4?style=for-the-badge&logo=google" />
<img src="https://img.shields.io/badge/HuggingFace-yellow?style=for-the-badge&logo=huggingface&logoColor=black" />

</div>

---

## 🔍 Overview

**NBK-Youth** is a full-stack, secure, and scalable web application. It combines a robust **React + Vite** frontend with a feature-rich **Node.js + Express** backend, powered by **MongoDB**, **Web Push**, **Cloudinary**, and **PWA** support. It's under active development with frequent updates, new features, and ongoing improvements.

---

## 📌 Why This Project ?

NBK-Youth is designed to streamline content, finance, and user management in a unified platform. Key highlights:

- 🔐 **Role-Based Access Control**
- 📈 **Activity Logs & Analytics**
- 🖼️ **Multimedia & Collection Manager**
- 🔔 **Push Notifications**
- 🧩 **Modular APIs for Rapid Development**

---

## ✨ Features

- **👤 User Authentication & Profiles:**  
  Supports sign-up, signin, forget password, role-based access (Developer, Financier, Admin, User),  category-based UI (Youth, General).

- **💰 Finance Management:**  
  Handle income, expenses, estimation, verification, recycle bin, and budgeting with visual statistics.

- **🖼️ Media & Content:**  
  Slides, banners, YouTube & Drive media uploads, moments and songs music player.

- **🔔 Notifications & Utilities:**  
  Web push notifications, site maintenance toggle, log tracking, PDF exports, and QR generator.

- **🧩 PWA & Multilingual:**  
  Built as a Progressive Web App with support for languages like Telugu and English.

- **🛠️ Admin Panel:**  
  Manage users, roles, site settings, and oversee all application data with full administrative control.

 - **📜 Histories & Records:**  
   Archive and manage past events and financial transactions with timeline views for easy reference and future auditing.

- **⏱️ Keep-Alive & Automation:**  
   GitHub Actions used to keep Backend server and OTP refresh token endpoints alive.  

- **☁️ Google Cloud Integration:**  
   A Service Account is used for storing media on Google Drive, and OAuth credentials are used for sending OTPs.  

- **🤖 Vini AI**  
  - Chat with data using natural language.  
  - **Gemini API**: For reasoning, summarization, and context understanding.  
  - **Hugging Face models**: For embeData chunking + embeddings for previous records of data.  
  
---

## 🧱 Tech Stack

### Frontend:
- **React + Vite**
- **Tailwind CSS**
- **PWA plugin**
- **JS libraries**

### Backend:
- **Node.js + Express**
- **MongoDB**
- **CORS, JWT, bcrypt, dotenv**
- **Cloudinary, Google Drive**
- **Google APIs, Web-Push**
- **Gemini API, Hugging Face APIs**

### Hosting:
- **Frontend:** [Vercel](https://vercel.com/)
- **Backend:** [Render](https://render.com/)

---

## ⚙️ Setup Instructions

### 📦 Prerequisites:
- Node.js
- MongoDB connection

---

### 🖥️ Backend Setup

```bash
git clone https://github.com/Vineethkolli/NBK-Youth.git
cd ../backend
npm install
```

Create `.env` file:

```
FRONTEND_URL=http://localhost:5173
MONGODB_URI=
JWT_SECRET=

# VAPID Keys for Web Push Notifications
PUBLIC_VAPID_KEY=
PRIVATE_VAPID_KEY=

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Gmail Configuration
GMAIL_USER=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

DEFAULT_DEVELOPER_PASSWORD=

# Google Drive API Credentials
GOOGLE_DRIVE_CREDENTIALS=
GOOGLE_DRIVE_FOLDER_ID=

# AI Services
HUGGINGFACE_API_KEY=
GEMINI_API_KEY=
```

Run backend:

```bash
node server.js
```

---

### 🖥️ Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env` file:

```
VITE_BACKEND_URL=http://localhost:5000
VITE_GA_MEASUREMENT_ID=
```

Run frontend:

```bash
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## 🙋‍♂️ Credits / Contact

This project was developed by **Kolli Vineeth**  
🔗 GitHub: [@Vineethkolli](https://github.com/Vineethkolli)


<div align="center"> ©2024 Designed and Developed by <strong>Kolli Vineeth</strong> </div>
