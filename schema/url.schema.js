// const mongoose = require("mongoose");

// const urlSchema = new mongoose.Schema({
//   originalUrl: { type: String, required: true },
//   shortUrl: { type: String, required: true, unique: true },
//   remarks: { type: String },
//   email: { type: String, required: true }, // New field for email
//   expirationDate: { type: Date },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Url", urlSchema);














const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  remarks: { type: String },
  email: { type: String, required: true },
  expirationDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  clicks: { type: Number, default: 0 }, // Keep track of clicks
  redirectionLogs: [ // Log for each redirection
    {
      timestamp: { type: Date, default: Date.now },
      ip: { type: String },
      userAgent: { type: String },
      device: { type: String }
    }
  ]
});


module.exports = mongoose.model("Url", urlSchema);
