# AI Page Reporter - Chrome Extension 🚀

[![License](https://img.shields.io/badge/license-GPL-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/TBD/)  

AI Page Reporter is a **Chrome extension** that helps users **report AI-generated web pages**, remove flagged results from **Google Search**, and provide a **community discussion** around potentially AI-generated content.


## 📌 **Features**
✅ Floating **AI Reporter widget** on every webpage  
✅ **One-click reporting** to flag pages as AI-generated  
✅ **Community comments** to discuss authenticity  
✅ **AI-based detection** and highlighting of suspicious text  
✅ **Google Search result filtering** to hide flagged AI content  


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
AI Page Reporter uses a backend API to store reports, manage comments, and detect AI-generated content.

### **Option 1: Use an Existing Server**
Modify `SERVER_URL` in `background.js` and `content.js` to point to an **existing API**.

### **Option 2: Run a Local API**
1. **Install dependencies**:
   ```sh
   pip install flask
   ```
2. **Run the server**:
   ```sh
   python server.py
   ```
3. Modify `SERVER_URL` to `http://localhost:5000/api` in `background.js` and `content.js`.

## 🎯 **Usage**
### **🔹 AI Reporter Widget**
- Appears on all web pages (bottom-right corner).
- Click **“Report AI?”** to flag the current page.
- Click **“Toggle Comments”** to see community discussions.

### **🔹 Popup Menu**
- Click the **extension icon** in Chrome.
- Click **"Report Current Page"** to submit a report.

### **🔹 Google Search Filtering**
- **Flagged AI-generated pages** will be hidden from Google search results.


## 🛠 **Project Structure**
```
ai-page-reporter/
├── manifest.json        # Chrome Extension Manifest
├── background.js        # Background script (handles API calls)
├── content.js           # Content script (injects AI Reporter widget)
├── popup.html           # Popup UI
├── popup.js             # Popup functionality
├── openapi.yaml         # OpenAPI Specification for the backend
├── README.md            # This ReadMe file
└── LICENSE              # License information
```


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
