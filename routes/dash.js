const express = require("express");
const router = express.Router();
const Url = require("../schema/url.schema");
const crypto = require("crypto");
const UAParser = require("ua-parser-js"); // Install this: npm install ua-parser-js



router.get("/clicks", async (req, res) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required" });
    }
  
    try {
      // Build the query object
      let query = { email };
  
      // Pipeline 1: Total Clicks
      const totalClicksPipeline = [
        { $match: query },
        { $unwind: "$redirectionLogs" },
        { $group: { _id: null, totalClicks: { $sum: 1 } } },
      ];
  
      // Pipeline 2: Date-wise Clicks
      const dateWiseClicksPipeline = [
        { $match: query },
        { $unwind: "$redirectionLogs" },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$redirectionLogs.timestamp" },
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }, // Sort by date in ascending order
        {
          $project: {
            date: "$_id",
            clicks: 1,
            _id: 0,
          },
        },
      ];



  
      // Pipeline 3: Device-wise Clicks
      const deviceWiseClicksPipeline = [
        { $match: query },
        { $unwind: "$redirectionLogs" },
        {
          $group: {
            _id: "$redirectionLogs.device",
            clicks: { $sum: 1 },
          },
        },
        {
          $project: {
            device: "$_id",
            clicks: 1,
            _id: 0,
          },
        },
      ];
  
      // Execute all pipelines
      const [totalClicksResult, dateWiseClicksResult, deviceWiseClicksResult] =
        await Promise.all([
          Url.aggregate(totalClicksPipeline),
          Url.aggregate(dateWiseClicksPipeline),
          Url.aggregate(deviceWiseClicksPipeline),
        ]);
  
      // Extract total clicks
      const totalClicks = totalClicksResult[0]?.totalClicks || 0;
  
      // Format date-wise clicks
      const dateWiseClicks = dateWiseClicksResult.map((item) => ({
        date: item.date,
        clicks: item.clicks,
      }));
  
      // Format device-wise clicks
      const deviceWiseClicks = deviceWiseClicksResult.map((item) => ({
        device: item.device,
        clicks: item.clicks,
      }));
  
      // Send the response
      res.status(200).json({
        totalClicks,
        dateWiseClicks,
        deviceWiseClicks,
      });
    } catch (error) {
      console.error("Error fetching clicks data:", error.message || error);
      res.status(500).json({ error: "Error fetching clicks data" });
    }
  });
  

  
module.exports = router;






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





// router.get("/clicks", async (req, res) => {
//     const { email } = req.query;
  
//     if (!email) {
//       return res.status(400).json({ error: "Email query parameter is required" });
//     }
  
//     try {
//       // Build the query object
//       let query = { email };
  
//       // First pipeline: Aggregate clicks grouped by day and device type
//       let pipelineByDevice = [
//         { $match: query },  // Match based on email
//         { $unwind: "$redirectionLogs" },  // Unwind the redirection logs
//         {
//           $project: {
//             date: { $dateToString: { format: "%Y-%m-%d", date: "$redirectionLogs.timestamp" } },  // Extract date from timestamp
//             device: "$redirectionLogs.device"  // Include device type
//           }
//         },
//         {
//           $group: {
//             _id: { date: "$date", device: "$device" },  // Group by date and device
//             totalClicks: { $sum: 1 }  // Count clicks for each device per day
//           }
//         },
//         { $sort: { "_id.date": 1 } }  // Sort by date
//       ];
  
//       // Second pipeline: Aggregate clicks grouped by day (without device)
//       let pipelineByDay = [
//         { $match: query },  // Match based on email
//         { $unwind: "$redirectionLogs" },  // Unwind the redirection logs
//         {
//           $project: {
//             date: { $dateToString: { format: "%d-%m-%Y", date: "$redirectionLogs.timestamp" } },  // Extract date from timestamp
//           }
//         },
//         {
//           $group: {
//             _id: "$date",  // Group by date
//             totalClicks: { $sum: 1 }  // Count clicks per day
//           }
//         },
//         { $sort: { _id: -1 } }  // Sort by date
//       ];
  
//       // Execute both aggregations
//       const dailyClicksByDevice = await Url.aggregate(pipelineByDevice);
//       const dailyClicks = await Url.aggregate(pipelineByDay);
  
//       // Calculate cumulative clicks and device-wise clicks for the first pipeline
//       let cumulativeClicks = 0;
//       let deviceClickCounts = {};  // Object to hold device-wise click counts
//       const dailyWithDeviceClicks = dailyClicksByDevice.map(day => {
//         cumulativeClicks += day.totalClicks;  // Add current day's clicks to the cumulative count
  
//         // Initialize device-wise counts if not already present
//         if (!deviceClickCounts[day._id.device]) {
//           deviceClickCounts[day._id.device] = 0;
//         }
  
//         deviceClickCounts[day._id.device] += day.totalClicks;  // Add the clicks for this device
  
//         return {
//           date: day._id.date,
//           device: day._id.device,
//           totalClicks: day.totalClicks,
//           cumulativeClicks  // Include the cumulative count
//         };
//       });
  
//       // Calculate cumulative clicks for the second pipeline (without device breakdown)
//       let cumulativeClicksForDay = 0;
//       const dailyWithCumulativeClicks = dailyClicks.map(day => {
//         cumulativeClicksForDay += day.totalClicks;  // Add current day's clicks to the cumulative count
//         return {
//           date: day._id,
//           totalClicks: day.totalClicks,
//           cumulativeClicksForDay // Include the cumulative count without device breakdown
//         };
//       });
  
//       // Calculate total clicks across all days
//       const totalClicks = cumulativeClicks;
  
//       // Calculate total device-wise clicks
//       const totalDeviceClicks = Object.entries(deviceClickCounts).map(([device, clicks]) => ({ device, clicks }));
  
      
  
//       // Return the result
//       res.status(200).json({
//         totalClicks,  // Total clicks across all days
//         totalDeviceClicks,  // Total clicks per device
//         dailyClicks: dailyWithCumulativeClicks  // Daily click counts without device breakdown and cumulative sum
//       });
//     } catch (error) {
//       console.error("Error fetching clicks:", error.message || error);
//       res.status(500).json({ error: "Error fetching clicks" });
//     }
//   });
  

//   module.exports = router;






// router.get("/clicks", async (req, res) => {
//     const { email } = req.query;
  
//     if (!email) {
//       return res.status(400).json({ error: "Email query parameter is required" });
//     }
  
//     try {
//       // Build the query object
//       let query = { email };
  
//       // Pipeline 1: Total Clicks
//       const totalClicksPipeline = [
//         { $match: query },
//         { $unwind: "$redirectionLogs" },
//         { $group: { _id: null, totalClicks: { $sum: 1 } } },
//       ];
  
//       // Pipeline 2: Date-wise Clicks
//       const dateWiseClicksPipeline = [
//         { $match: query },
//         { $unwind: "$redirectionLogs" },
//         {
//           $group: {
//             _id: {
//               $dateToString: { format: "%Y-%m-%d", date: "$redirectionLogs.timestamp" },
//             },
//             clicks: { $sum: 1 },
//           },
//         },
//         { $sort: { _id: 1 } }, // Sort by date in ascending order
//         {
//           $project: {
//             date: "$_id",
//             clicks: 1,
//             _id: 0,
//           },
//         },
//       ];
  
//       // Pipeline 3: Device-wise Clicks
//       const deviceWiseClicksPipeline = [
//         { $match: query },
//         { $unwind: "$redirectionLogs" },
//         {
//           $group: {
//             _id: "$redirectionLogs.device",
//             clicks: { $sum: 1 },
//           },
//         },
//         {
//           $project: {
//             device: "$_id",
//             clicks: 1,
//             _id: 0,
//           },
//         },
//       ];
  
//       // Execute all pipelines
//       const [totalClicksResult, dateWiseClicksResult, deviceWiseClicksResult] =
//         await Promise.all([
//           Url.aggregate(totalClicksPipeline),
//           Url.aggregate(dateWiseClicksPipeline),
//           Url.aggregate(deviceWiseClicksPipeline),
//         ]);
  
//       // Extract total clicks
//       const totalClicks = totalClicksResult[0]?.totalClicks || 0;
  
//       // Compute cumulative date-wise clicks
//       let cumulativeCount = 0;
//       const dateWiseClicks = dateWiseClicksResult.map((item) => {
//         cumulativeCount += item.clicks;
//         return {
//           date: item.date,
//           clicks: cumulativeCount, // Update cumulative clicks
//         };
//       });
  
//       // Format device-wise clicks
//       const deviceWiseClicks = deviceWiseClicksResult.map((item) => ({
//         device: item.device,
//         clicks: item.clicks,
//       }));
  
//       // Send the response
//       res.status(200).json({
//         totalClicks,
//         dateWiseClicks,
//         deviceWiseClicks,
//       });
//     } catch (error) {
//       console.error("Error fetching clicks data:", error.message || error);
//       res.status(500).json({ error: "Error fetching clicks data" });
//     }
//   });
  
//   module.exports = router;
  