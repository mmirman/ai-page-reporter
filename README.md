# AI Page Reporter - Chrome Extension 🚀

[![License](https://img.shields.io/badge/license-GPL-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/TBD/)  

AI Page Reporter is a **Chrome extension** that helps users **report AI-generated web pages**, remove flagged results from **Google Search**, and provide a **community discussion** around potentially AI-generated content.


## 📌 **Features**
✅ Floating **AI Reporter widget** on every webpage  
✅ **One-click reporting** to flag pages as AI-generated  
✅ **Community-driven** reporting system  
✅ **Social media integration** for reporting AI content on platforms like Twitter, LinkedIn, Facebook, and Reddit  
✅ **AI-based detection** and highlighting of suspicious text  
✅ **Visit tracking** to measure report-to-visit ratios  


## 📂 **Installation Guide**

### 🔹 **1. Install the Chrome Extension Manually**
1. **Download** the repository or clone it:
   ```sh
   git clone https://github.com/mmirman/ai-page-reporter.git
   ```
2. **Open Chrome** and navigate to:
   ```chrome
   chrome://extensions/
   ```
3. **Enable Developer Mode** (toggle in the top-right).
4. Click **"Load Unpacked"** and select the `ai-page-reporter` folder.
5. **The extension is now installed! 🎉**

## 🖥 **Running the Backend API**
AI Page Reporter uses a Node.js/Express backend API to store reports, track visits, and detect AI-generated content.

### **Option 1: Use the In-Memory Database (Development)**
1. **Install dependencies**:
   ```sh
   npm install express cors mongoose morgan helmet mongodb-memory-server dotenv
   ```
2. **Run the server**:
   ```sh
   node server.js
   ```
   This will start the server with an in-memory MongoDB instance for development.

### **Option 2: Use a Real MongoDB Database (Production)**
1. **Create a `.env` file** with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://your-mongodb-connection-string
   PORT=8080
   REPORT_THRESHOLD=0.5
   IP_SALT=some-random-string-for-hashing
   ```
2. **Run the server**:
   ```sh
   node server.js
   ```

## 🎯 **Usage**
### **🔹 AI Reporter Widget**
- Appears on all web pages (bottom-right corner).
- Click **"Report as AI"** to flag the current page.
- The widget will show the AI evaluation status of the current page.

### **🔹 Popup Menu**
- Click the **extension icon** in Chrome.
- See statistics about the current page including visit count and report percentage.
- First-time visits will prompt you with a reporting option.

### **🔹 Social Media Integration**
- When browsing supported social media platforms (Twitter, LinkedIn, Facebook, Reddit), the extension adds **"Report AI"** buttons to posts.
- Click these buttons to report AI-generated content directly from your feed.


## 🛠 **Project Structure**
```
ai-page-reporter/
├── manifest.json        # Chrome Extension Manifest
├── background.js        # Background script (handles API calls)
├── content.js           # Content script (injects AI Reporter widget)
├── popup.html           # Popup UI
├── popup.js             # Popup functionality
├── arrive.js            # Library for detecting new DOM elements
├── social-integration.js # Social media platform integration
├── server.js            # Express server for backend API
├── README.md            # This ReadMe file
└── LICENSE              # License information
```

## 🔄 **API Endpoints**

The server provides the following API endpoints:

- **POST /api/report** - Submit a report for a URL
- **GET /api/status** - Get the status of a URL (report count, visit count, etc.)
- **POST /api/ai-evaluate** - Evaluate text for AI-generated content
- **POST /api/trackVisit** - Track a visit to a URL
- **GET /api/config** - Get server configuration (report threshold)

## 👥 **Contributing**
We welcome contributions! To contribute:
1. **Fork** the repository.
2. **Create a branch** (`git checkout -b feature-branch`).
3. **Commit changes** (`git commit -m "Added new feature"`).
4. **Push** (`git push origin feature-branch`).
5. Open a **Pull Request**.

## 📝 **License**
This project is licensed under the **GPL License** - see the [LICENSE](LICENSE) file for details.

## 📧 **Contact & Support**
For any issues or suggestions:
- Open an **issue** on GitHub.
- Contact **matt@truthsuite.com**.

## 🌟 **Support the Project**
If you like this project, **give it a ⭐ on GitHub**! 😊


[![Star History Chart](https://api.star-history.com/svg?repos=mmirman/ai-page-reporter&type=Date)](https://star-history.com/#mmirman/ai-page-reporter)
