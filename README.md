# 🏥 HealthCare+

<div align="center">

![Healthcare+ Banner](https://img.shields.io/badge/Healthcare+-Management%20System-blue?style=for-the-badge)

**A comprehensive healthcare appointment management system connecting patients, doctors, and administrators seamlessly.**

[![Made with React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [Deployment](#-deployment)

</div>

---

## 📋 Overview

**HealthCare+** is a modern, full-stack healthcare appointment management platform designed to streamline the interaction between patients, doctors, and administrators. Built with scalability and user experience in mind, it offers intuitive dashboards, real-time notifications, and AI-ready backend integration.

---

## ✨ Features

### 👤 **Multi-Role Authentication**
- Secure JWT-based authentication
- Role-based access control (Patient, Doctor, Admin)
- Encrypted password storage

### 📅 **Appointment Management**
- Easy appointment booking system
- Real-time appointment status updates
- Appointment history tracking
- Cancellation and rescheduling support

### 🩺 **Doctor Dashboard**
- View and manage patient appointments
- Update appointment status
- Access patient information
- Schedule management

### 🧑‍⚕️ **Patient Dashboard**
- Browse available doctors
- Book appointments with preferred doctors
- Track appointment history
- Receive appointment notifications

### 👨‍💼 **Admin Dashboard**
- Manage users (Patients & Doctors)
- Oversee all appointments
- System analytics and reporting
- User verification and approval

### 🔔 **Smart Notifications**
- Email notifications via Nodemailer
- Automated appointment reminders
- Status update alerts
- Scheduled notifications using node-cron

### 🤖 **AI-Ready Backend**
- Scalable architecture for AI integration
- Future-ready for intelligent appointment scheduling
- Data analytics capability

### 📱 **Responsive Design**
- Mobile-first approach
- Cross-browser compatibility
- Intuitive user interface

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose |
|-----------|---------|
| ⚛️ React | UI Framework |
| ⚡ Vite | Build Tool & Dev Server |
| 🔌 Axios | HTTP Client |

### **Backend**
| Technology | Purpose |
|-----------|---------|
| 🟢 Node.js | Runtime Environment |
| 🚂 Express.js | Web Framework |
| 🍃 MongoDB Atlas | Cloud Database |
| 🔐 JWT | Authentication |
| 📧 Nodemailer | Email Service |
| ⏰ node-cron | Scheduled Tasks |

---

## 📁 Project Structure

```
HealthCare+/
├── 📂 frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── 📂 backend/           # Node.js backend application
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── config/
│   ├── package.json
│   └── server.js
│
└── 📄 README.md
```

---

## 🚀 Installation

### **Prerequisites**
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account
- Git

### **Backend Setup**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/healthcare-plus.git
cd healthcare-plus
```

2. **Navigate to backend directory**
```bash
cd backend
```

3. **Install dependencies**
```bash
npm install
```

4. **Configure environment variables**
```bash
cp .env.example .env
```
Edit `.env` file with your credentials:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

5. **Start the backend server**
```bash
npm start
```
Backend will run on `http://localhost:5000`

### **Frontend Setup**

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API endpoint**
Update the API base URL in your configuration file if needed.

4. **Start the development server**
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

---

## 💻 Usage

### **For Patients:**
1. Register/Login to your account
2. Browse available doctors
3. Book an appointment
4. Manage your appointments from the dashboard

### **For Doctors:**
1. Login with doctor credentials
2. View appointment requests
3. Approve/reject appointments
4. Manage your schedule

### **For Admins:**
1. Login with admin credentials
2. Manage users and appointments
3. View system analytics
4. Approve doctor registrations

---

## 🌐 Deployment

### **Frontend Deployment** (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

### **Backend Deployment** (Render)
```bash
cd backend
# Deploy to Render with environment variables configured
```

**Live Demo**: https://healthcare-appointment-follow-up-ma.vercel.app/

---

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

---

## 📦 Dependencies

### Backend
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "nodemailer": "^6.9.1",
  "node-cron": "^3.0.2",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.3.4",
  "react-router-dom": "^6.10.0"
}
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Utkarsh Tripathi**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Vercel for frontend deployment
- Render for backend deployment
- All contributors and supporters

---

<div align="center">

**Made with ❤️ by Utkarsh Tripathi**

⭐ Star this repository if you find it helpful!

</div>
