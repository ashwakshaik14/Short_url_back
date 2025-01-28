const express = require("express");
const router = express.Router();
const Url = require("../schema/url.schema");
const crypto = require("crypto");
const UAParser = require("ua-parser-js"); // Install this: npm install ua-parser-js


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
//             totalClicks: { $sum: 1 },
//           },
//         },
//         { $sort: { _id: -1 } }, // Sort by date in ascending order
//         {
//           $project: {
//             date: "$_id",
//             totalClicks: 1,
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
  
//       // Calculate cumulative clicks for date-wise data
//       let cumulativeClicksForDay = 0;
//       const dateWiseClicks = dateWiseClicksResult.map((item) => {
//         cumulativeClicksForDay += item.totalClicks; // Accumulate clicks
//         return {
//           date: item.date,
//           totalClicks: item.totalClicks,
//           cumulativeClicks: cumulativeClicksForDay, // Include cumulative count
//         };
//       });
  
//       // Calculate cumulative clicks and device-wise clicks
//       let cumulativeClicks = 0;
//       let deviceClickCounts = {}; // To hold device-wise click counts
//       const deviceWiseClicks = deviceWiseClicksResult.map((item) => {
//         cumulativeClicks += item.clicks; // Accumulate total clicks
//         deviceClickCounts[item.device] = (deviceClickCounts[item.device] || 0) + item.clicks; // Add device clicks
//         return {
//           device: item.device,
//           clicks: item.clicks,
//         };
//       });
  
//       const totalDeviceClicks = Object.entries(deviceClickCounts).map(([device, clicks]) => ({
//         device,
//         clicks,
//       }));
  
//       // Send the response
//       res.status(200).json({
//         totalClicks,
//         dateWiseClicks,
//         deviceWiseClicks,
//         cumulativeClicks, // Total cumulative clicks
//         totalDeviceClicks, // Total device-wise clicks
//       });
//     } catch (error) {
//       console.error("Error fetching clicks data:", error.message || error);
//       res.status(500).json({ error: "Error fetching clicks data" });
//     }
//   });
  
//   module.exports = router;
  



router.get("/clicks", async (req, res) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required" });
    }
  
    try {
      let query = { email };
  
      const totalClicksPipeline = [
        { $match: query },
        { $unwind: "$redirectionLogs" },
        { $group: { _id: null, totalClicks: { $sum: 1 } } },
      ];
  
      const dateWiseClicksPipeline = [
        { $match: { email, "redirectionLogs": { $exists: true, $ne: [] } } },
        { $unwind: "$redirectionLogs" },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$redirectionLogs.timestamp",
                timezone: "Asia/Kolkata",
              },
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        {
          $project: {
            date: "$_id",
            clicks: 1,
            _id: 0,
          },
        },
      ];
  
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
  
      const [totalClicksResult, dateWiseClicksResult, deviceWiseClicksResult] =
        await Promise.all([
          Url.aggregate(totalClicksPipeline),
          Url.aggregate(dateWiseClicksPipeline),
          Url.aggregate(deviceWiseClicksPipeline),
        ]);
  
      const totalClicks = totalClicksResult[0]?.totalClicks || 0;
      const dateWiseClicks = dateWiseClicksResult.map((item) => ({
        date: item.date,
        clicks: item.clicks,
      }));
      const deviceWiseClicks = deviceWiseClicksResult.map((item) => ({
        device: item.device,
        clicks: item.clicks,
      }));
  
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
  