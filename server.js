// server.js - Express server for AI Page Reporter API
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');

const { MongoMemoryServer } = require('mongodb-memory-server');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-reporter';
const REPORT_THRESHOLD = process.env.REPORT_THRESHOLD || 0.5; // Default 50% threshold

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('combined')); // Request logging

// Define schemas
const reportSchema = new mongoose.Schema({
  url: { type: String, required: true, index: true },
  domain: { type: String, index: true },
  postId: { type: String, index: true },
  platform: { type: String, enum: ['linkedin', 'twitter', 'other'], index: true },
  aiFlag: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  userAgent: String,
  ipHash: String, // Hashed IP for rate limiting without storing IPs
  reporterSessionId: String
});

const urlStatSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  domain: { type: String, index: true },
  postId: { type: String, index: true },
  platform: { type: String, enum: ['linkedin', 'twitter', 'other'], index: true },
  reportCount: { type: Number, default: 0 },
  uniqueReporters: { type: Number, default: 0 },
  aiScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  firstReported: { type: Date },
  shouldHide: { type: Boolean, default: false },
  totalVisits: { type: Number, default: 0 }
});

// Create models
const Report = mongoose.model('Report', reportSchema);
const UrlStat = mongoose.model('UrlStat', urlStatSchema);

// Helper function to parse URL and extract platform info
function parseUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    let platform = 'other';
    let postId = null;
    
    if (domain.includes('linkedin.com')) {
      platform = 'linkedin';
      // Extract LinkedIn post ID
      const match = url.match(/linkedin\.com\/feed\/update\/urn:li:activity:(\d+)/);
      if (match) postId = match[1];
    } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
      platform = 'twitter';
      // Extract Twitter post ID
      const match = url.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/);
      if (match) postId = match[1];
    }
    
    return { domain, platform, postId };
  } catch (error) {
    console.error('URL parsing error:', error);
    return { domain: 'unknown', platform: 'other', postId: null };
  }
}

// Hash function for IP addresses (for privacy)
function hashIP(ip) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT).digest('hex');
}

// API Routes
// Submit a report
app.post('/api/report', async (req, res) => {
  try {
    const { url, aiFlag, timestamp, sessionId } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    
    const { domain, platform, postId } = parseUrl(url);
    const ipHash = hashIP(req.ip);
    
    // Check for duplicate reports
    const existingReport = await Report.findOne({ 
      url, 
      $or: [
        { ipHash },
        { reporterSessionId: sessionId }
      ] 
    });
    
    if (existingReport) {
      return res.status(409).json({ 
        success: false, 
        message: 'You have already reported this URL' 
      });
    }
    
    // Create new report
    const report = new Report({
      url,
      domain,
      platform,
      postId,
      aiFlag: !!aiFlag,
      timestamp: timestamp || Date.now(),
      userAgent: req.headers['user-agent'],
      ipHash,
      reporterSessionId: sessionId
    });
    
    await report.save();
    
    // Update URL stats
    let urlStat = await UrlStat.findOne({ url });
    if (!urlStat) {
      urlStat = new UrlStat({
        url,
        domain,
        platform,
        postId,
        reportCount: 1,
        uniqueReporters: 1,
        firstReported: Date.now()
      });
    } else {
      urlStat.reportCount += 1;
      urlStat.uniqueReporters += 1;
      urlStat.lastUpdated = Date.now();
    }
    
    await urlStat.save();
    
    res.json({ 
      success: true, 
      message: 'Report submitted successfully',
      stats: {
        reportCount: urlStat.reportCount,
        shouldHide: urlStat.shouldHide
      }
    });
  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get URL status
app.get('/api/status', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    
    const urlStat = await UrlStat.findOne({ url });
    
    if (!urlStat) {
      return res.json({ 
        success: true, 
        reported: false,
        shouldHide: false,
        reportCount: 0,
        totalVisits: 0,
        reportPercentage: 0
      });
    }
    
    const reportPercentage = urlStat.totalVisits > 0 
      ? (urlStat.reportCount / urlStat.totalVisits) * 100 
      : 0;
    
    res.json({
      success: true,
      reported: urlStat.reportCount > 0,
      shouldHide: urlStat.shouldHide,
      reportCount: urlStat.reportCount,
      totalVisits: urlStat.totalVisits,
      reportPercentage
    });
  } catch (error) {
    console.error('Status request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// AI text evaluation endpoint
app.post('/api/ai-evaluate', async (req, res) => {
  try {
    const { text, url } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }
    
    const aiScore = simpleAIDetection(text);
    
    if (url) {
      await UrlStat.findOneAndUpdate(
        { url },
        { aiScore, lastUpdated: Date.now() },
        { upsert: true }
      );
    }
    
    res.json({
      success: true,
      score: aiScore
    });
  } catch (error) {
    console.error('AI evaluation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get report threshold
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    reportThreshold: REPORT_THRESHOLD * 100 // Convert to percentage
  });
});

// Helper function to get total views (placeholder)
// In production, this would be a more sophisticated tracking mechanism
async function getTotalViews(url) {
  // Placeholder: return minimum views to consider for hiding
  return 100;
}

// Simple AI detection algorithm (placeholder)
// In production, you would use a proper NLP model or API
function simpleAIDetection(text) {
  // Placeholder implementation - counts certain patterns
  const patterns = [
    /as an AI language model/i,
    /I don't have personal/i,
    /I cannot provide/i,
    /repetitive phrasing/i,
    /overly formal language/i,
    /lack of nuance/i
  ];
  
  let score = 0;
  const sample = text.slice(0, 5000); // Limit text size
  
  patterns.forEach(pattern => {
    if (pattern.test(sample)) {
      score += 0.1;
    }
  });
  
  // Add some randomness for placeholder implementation
  score += Math.random() * 0.3;
  
  return Math.min(Math.max(score, 0), 1); // Ensure score is between 0 and 1
}

// Update the trackVisit endpoint
app.post('/api/trackVisit', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    // Find or create URL record
    let urlRecord = await UrlStat.findOne({ url }).exec();  // Add .exec()
    
    if (!urlRecord) {
      urlRecord = new UrlStat({
        url,
        totalVisits: 1,
        reportCount: 0
      });
    } else {
      urlRecord.totalVisits += 1;
    }
    
    await urlRecord.save();
    
    console.log(`Tracked visit for ${url}. Total visits: ${urlRecord.totalVisits}`);
    
    res.json({ 
      success: true, 
      totalVisits: urlRecord.totalVisits,
      isFirstVisit: urlRecord.totalVisits === 1
    });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track visit',
      details: error.message 
    });
  }
});

const startServer = async () => {
  try {
    // Start MongoMemoryServer
    const mongod = new MongoMemoryServer();
    await mongod.start();
    const mongoUri = mongod.getUri();
    console.log('In-memory MongoDB started at:', mongoUri);

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Start Express server only after MongoDB is connected
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer().catch(console.error);

module.exports = app; // For testing