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
  