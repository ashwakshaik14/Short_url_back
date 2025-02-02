const express = require("express");
const router = express.Router();
const Url = require("../schema/url.schema");
const crypto = require("crypto");
const UAParser = require("ua-parser-js"); // Install this: npm install ua-parser-js


// Generate Short URL
const generateShortUrl = () => crypto.randomBytes(4).toString("hex"); // 8-char alphanumeric string




router.post("/shorten", async (req, res) => {
  const { originalUrl, remarks, email, expirationDate } = req.body;

  console.log("Request Body:", req.body); // Add this for debugging


  if (!originalUrl) {
    console.warn("Original URL is missing in the request body");
    return res.status(400).json({ error: "Original URL is required" });
  }

  if (!email) {
    console.warn("Email is missing in the request body");
    return res.status(400).json({ error: "Email is required" });
  }

  const shortcode = generateShortUrl();
  const fullShortUrl = `https://short-url-back-48bn.onrender.com/api/url/${shortcode}`; // Change "click-me" to "localhost:3000"

  const urlData = new Url({
    originalUrl,
    shortUrl: fullShortUrl,
    remarks,
    email, // Include email in the schema
    expirationDate,
  });

  try {
    console.log("Saving data to database:", urlData);

    await urlData.save();
    console.log("URL saved successfully!");

    res.status(201).json({
      message: "URL shortened successfully",
      data: {
        originalUrl,
        shortUrl: fullShortUrl,
        remarks,
        email, // Include email in the response
        expirationDate,
      },
    });
  } catch (error) {
    console.error("Error saving URL:", error.message || error);
    res.status(500).json({ error: "Error saving URL" });
  }
});



router.get("/:shortcode", async (req, res) => {
  const { shortcode } = req.params;

  try {
    // Find the URL document by the short code
    const urlData = await Url.findOneAndUpdate(
      { shortUrl: { $regex: `${shortcode}$` } },
      { $inc: { clicks: 1 } }, // Increment clicks field
      { new: true } // Return the updated document
    );

    if (!urlData) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    // Log redirection details
    const timestamp = new Date();
    const xForwardedFor = req.headers['x-forwarded-for'] || ''; // Get the X-Forwarded-For header
    const clientIp = xForwardedFor.split(',')[0] || req.ip; // Extract the first IP
    // const ip = req.headers['x-forwarded-for'] || req.ip; // Use X-Forwarded-For if available
    const userAgent = req.headers['user-agent']; // User agent string from header
    const device = getDevice(userAgent); // Function to parse the device from the user agent

    // Save the redirection log
    urlData.redirectionLogs.push({
      timestamp,
      ip:clientIp,
      userAgent,
      device
    });

    // Save the updated URL document
    await urlData.save();

    // Redirect the user to the original URL
    res.redirect(urlData.originalUrl);
  } catch (error) {
    console.error("Error during redirection:", error.message || error);
    res.status(500).json({ error: "Error during redirection" });
  }
});

// Helper function to get the device type
function getDevice(userAgent) {
  if (/android/i.test(userAgent)) {
    return "Android";
  } else if (/iphone/i.test(userAgent)) {
    return "iPhone";
  } else if (/windows/i.test(userAgent)) {
    return "Windows";
  } else if (/macintosh/i.test(userAgent)) {
    return "MacOS";
  } else if (/linux/i.test(userAgent)) {
    return "Linux";
  } else {
    return "Unknown";
  }
}


router.get("/", async (req, res) => {
  const { email, pageType, sortKey, direction, search } = req.query;
  const limit = parseInt(req.query.limit) || 8;
  const page = parseInt(req.query.page) || 1;
 

  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }

  try {
    // Build the query object
    let query = { email };
    if (search) {
      query.remarks = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    let sort = {};
    if (sortKey) {
      const sortDirection = direction === "descending" ? -1 : 1;
      sort[sortKey] = sortDirection;
    }

    let totalUrls;
    let urls;
    if (pageType === "Links"){
    // Count total filtered URLs
    totalUrls = await Url.countDocuments(query);
    urls = await Url.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    }
    else{
      const url_s = await Url.find(query, "redirectionLogs");

    // Count the total number of IPs in redirectionLogs
    totalUrls = url_s.reduce((count, url) => count + url.redirectionLogs.length, 0);
    // totalUrls = await Url.countDocuments(query);
    let pipeline = [
      { $unwind: "$redirectionLogs" }, 
      { $match: query }, 
    ];

    if (Object.keys(sort).length > 0) {
      pipeline.push({ $sort: sort }); 
    }

    pipeline.push({
      $project: {
        originalUrl: 1, 
        shortUrl: 1,     
        remarks: 1,     
        email: 1,        
        expirationDate: 1,  
        createdAt: 1,    
        clicks: 1,
        _id : "$redirectionLogs._id",       
        timestamp: "$redirectionLogs.timestamp", 
        ip: "$redirectionLogs.ip", 
        userAgent: "$redirectionLogs.userAgent",
        device: "$redirectionLogs.device" 
      }}
    );

    pipeline.push(
      { $skip: (page - 1) * limit }, 
      { $limit: limit } 
    );

    urls = await Url.aggregate(pipeline);
    
    
    console.log(page);
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalUrls / limit); // 26/8 = 3.25 31/8 = 3.875
    console.log("total pages, limit",totalPages,limit);
    // Create a sort object
    

    // Fetch filtered, sorted, and paginated URLs
    

    res.status(200).json({
      totalUrls,
      totalPages,
      currentPage: page,
      limit,
      data: urls,
    });
  } catch (error) {
    console.error("Error fetching URLs:", error.message || error);
    res.status(500).json({ error: "Error fetching URLs" });
  }
});



// PUT /api/url/:id - Update URL by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { originalUrl, remarks, expirationDate } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "Original URL is required" });
  }

  try {
    // Find and update the URL by ID
    const updatedUrl = await Url.findByIdAndUpdate(
      id,
      { originalUrl, remarks, expirationDate },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedUrl) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.status(200).json({
      message: "URL updated successfully",
      data: updatedUrl,
    });
  } catch (error) {
    console.error("Error updating URL:", error.message || error);
    res.status(500).json({ error: "Error updating URL" });
  }
});



// DELETE /api/url/:id - Delete URL by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the URL by ID
    const deletedUrl = await Url.findByIdAndDelete(id);

    if (!deletedUrl) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.status(200).json({ message: "URL deleted successfully" });
  } catch (error) {
    console.error("Error deleting URL:", error.message || error);
    res.status(500).json({ error: "Error deleting URL" });
  }
});


module.exports = router;
