🚀 JobTrackr Enterprise

JobTrackr Enterprise is a sophisticated, single-file job application tracking system designed to help professionals manage their career search with precision. It features a modern "Deep Glass" UI, smart reminders, resume management, and enterprise-grade data handling—all without the need for a complex backend server setup.

Made with ❤️ by Vijay

✨ Features

📊 Dashboard & Management

KPI Overview: Real-time stats for Total Applications, Active, Interviews, and Rejections.

Advanced Table: Sortable and searchable list view with status badges and priority indicators.

CRUD Operations: Full Create, Read, Update, and Delete capabilities for job entries.

🧠 Smart Features

In-App Reminders: Set specific dates or recurring (3-day/Weekly) reminders for follow-ups.

Notification Center: Integrated notification bell to alert you when actions are needed.

AI Email Drafter: Instantly generates context-aware follow-up emails to recruiters using local logic (opens in your default mail client).

📝 Detailed Tracking

Comprehensive Fields: Track Company, Role, Salary, Location (Remote/Hybrid/On-site), Source, Referrals, and Recruiter Email.

Priority System: Tag jobs as High, Medium, or Low priority with visual color coding.

Resume Management: Upload and store PDF resumes directly within the application (Base64 encoding).

🛠 Utilities

Data Portability:

Import: Bulk import jobs via CSV (automatically cleans data).

Export: Download your entire database as a formatted CSV file (JobTrackr_User_Date.csv).

Dark/Light Mode: Fully responsive theme switching.

Responsive Design: Works seamlessly on Desktop and Mobile with a collapsible sidebar.

🛠️ Tech Stack

Frontend: HTML5, CSS3, JavaScript (ES6+ Modules).

Styling: Tailwind CSS (via CDN).

Icons: FontAwesome (via CDN).

Fonts: Plus Jakarta Sans (Google Fonts).

Backend (Serverless): Firebase (Firestore Database & Authentication).

⚙️ Setup Instructions

Since this is a client-side application using Firebase, you need to provide your own Firebase configuration keys.

1. Create a Firebase Project

Go to the Firebase Console.

Click Add project and name it JobTrackr.

Disable Google Analytics (optional) and create the project.

2. Enable Services

Authentication:

Go to Build > Authentication.

Click Get Started.

Enable Email/Password and Google providers.

Important: Go to Settings > Authorized domains and add localhost and 127.0.0.1.

Firestore Database:

Go to Build > Firestore Database.

Click Create Database.

Choose Test Mode (allows read/write access for development).

3. Get Your Config

Click the Gear Icon (Project Settings) in the top left sidebar.

Scroll down to Your apps.

Click the </> (Web) icon.

Register the app (e.g., "JobTrackr Web").

Copy the firebaseConfig object (apiKey, authDomain, etc.).

4. Update the Code

Open index.html in your code editor.

Scroll down to the <script> tag (approx. line 660).

Replace the placeholder values in the CONFIG object with your actual keys:

const CONFIG = {
firebase: {
apiKey: "AIzaSy...", // <--- PASTE HERE
authDomain: "...", // <--- PASTE HERE
projectId: "...", // <--- PASTE HERE
storageBucket: "...", // <--- PASTE HERE
messagingSenderId: "...", // <--- PASTE HERE
appId: "..." // <--- PASTE HERE
},
adminEmail: "your-admin-email@example.com", // This email gets Admin privileges
appId: "job-trackr-ent-v1"
};

🚀 How to Run

Due to browser security policies (CORS) regarding ES6 Modules, you cannot simply double-click the index.html file. You must serve it via a local server.

Option A: VS Code (Recommended)

Install the Live Server extension by Ritwick Dey.

Right-click index.html.

Select "Open with Live Server".

Option B: Python

Open your terminal/command prompt in the project folder.

Run: python3 -m http.server

Open your browser and go to http://localhost:8000.

📂 Project Structure

The entire application is contained within a single file for ease of deployment and sharing.

index.html: Contains:

HTML Structure (Modals, Panels, Sidebar).

CSS Styles (Tailwind config + Custom glassmorphism).

JavaScript Logic (Firebase connection, DOM manipulation, Logic).

👤 Admin Access

The application includes a role-based system (Admin vs. Standard User).

Standard User: Can create and view only their own applications.

Admin: Can view applications from ALL users (indicated by the user's email under the company name).

To become an Admin, ensure you login with the email defined in CONFIG.adminEmail.

📄 License

MIT License

Copyright (c) 2026 Vijay
