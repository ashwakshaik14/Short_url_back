// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const cors = require('cors'); // Import cors
// const bodyParser = require('body-parser');
// const userRoute = require('./routes/user');
// dotenv.config();

// const PORT = process.env.PORT || 3000;
// const app = express();

// const allowedOrigins = ["https://test-vite-app2.onrender.com", "http://localhost:5173"];
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // Middleware: JSON Parsing and URL-encoded data
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, connectTimeoutMS: 30000, useUnifiedTopology: true })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("Error connecting to MongoDB:", err));

// // Routes
// app.use("/api/user", userRoute);

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });








const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRoute = require("./routes/user");
const urlRoute = require("./routes/url"); // Import URL routes
const dashRoute=require("./routes/dash");



dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Check if MONGO_URI is set in environment variables
if (!process.env.MONGO_URI) {
  console.error("MongoDB URI is missing in the environment variables.");
  process.exit(1); // Exit the app if MongoDB URI is not found
}

// CORS Setup (Allow specific origins)
const allowedOrigins = ["https://short-url-r755.onrender.com", "http://localhost:5173"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.set('trust proxy', true);
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1); // Exit the app if MongoDB connection fails
  });

// Routes
app.use("/api/user", userRoute);
app.use("/api/url", urlRoute); // Use URL routes
app.use("/api/dash",dashRoute);


// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
