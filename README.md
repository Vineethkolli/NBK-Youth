<div align="center">

# 🌟 **NBK-YOUTH**  
### *Empowering Youth, Celebrating Unity and Joy*

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

<!-- Row 3 (AI Integrations) -->
<br/>
<img src="https://img.shields.io/badge/Vini_AI-purple?style=for-the-badge&logo=ai" />
<img src="https://img.shields.io/badge/Gemini_API-4285F4?style=for-the-badge&logo=google" />
<img src="https://img.shields.io/badge/HuggingFace-yellow?style=for-the-badge&logo=huggingface&logoColor=black" />

</div>

---

## 🔍 Overview

**NBK-Youth** is a full-stack, secure, and scalable web application. It combines a robust **React + Vite** frontend with a feature-rich **Node.js + Express** backend, powered by **MongoDB**, **Web Push**, **Cloudinary**, and **PWA** support. It's under active development with frequent updates, new features, and ongoing improvements.

🔗 Live : [nbkyouth.vercel.app](https://nbkyouth.vercel.app)

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
  Supports sign-up, signin, forget password, role-based access (Admin, Financier, Developer, User), category-based UI (Youth, General).

- **💰 Finance Management:**  
  Handle income, expenses, estimation, verification, recycle bin, and budgeting with visual statistics.

- **🖼️ Media & Content Tools:**  
  Slides, banners, YouTube video uploads, moments, songs and multilingual support.

- **🔔 Notifications & Utilities:**  
  Web push notifications, site maintenance toggle, log tracking, PDF exports, and QR generator.

- **🧩 PWA & Multilingual:**  
  Built as a Progressive Web App with support for languages like Telugu and English.

- **🤖 Vini AI**  
  - Chat with your data using natural language.  
  - **Gemini API**: For reasoning, summarization, and context understanding.  
  - **Hugging Face models**: For embeddings, NLP tasks, and custom AI workflows.  
  - Data chunking + embeddings for previous records of data.  
  - Future expansion: multimodal support (text, audio, image).  

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
- **JWT, bcrypt, dotenv**
- **Cloudinary, Google Drive APIs**
- **Nodemailer, Web-Push**
- **CORS-enabled APIs**
- **Gemini API, Hugging Face APIs**

### Hosting:
- **Frontend:** [Vercel](https://vercel.com/)
- **Backend:** [Render](https://render.com/)

---

## ⚙️ Setup Instructions

### 📦 Prerequisites:
- [Node.js](https://nodejs.org/)
- MongoDB connection (Atlas/local)
- VAPID Keys, Cloudinary API, Google API Credentials

---

### 🖥️ Backend Setup

```bash
git clone https://github.com/Vineethkolli/NBK-Youth.git
cd ../backend
npm install
```

Create `.env` file:

```
MONGODB_URI=your_mongodb_connection_string
PUBLIC_VAPID_KEY=your_webpush_public_key
PRIVATE_VAPID_KEY=your_webpush_private_key
FRONTEND_URL=http://localhost:5173
Also include needed JWT secret, Cloudinary creds, email credentials, Gemini api, Hugging face api, Google drive api credentials.
```

Run backend:

```bash
node server.js
```

---

### 💻 Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## 🙋‍♂️ Credits / Contact

This project was developed by **Kolli Vineeth**  
🔗 GitHub: [@Vineethkolli](https://github.com/Vineethkolli)