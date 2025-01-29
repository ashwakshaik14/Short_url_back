const express = require("express");
const router = express.Router();
const Url = require("../schema/url.schema");
const crypto = require("crypto");
const UAParser = require("ua-parser-js"); // Install this: npm install ua-parser-js



// router.get("/clicks", async (req, res) => {
//   const { email } = req.query;

//   if (!email) {
//     return res.status(400).json({ error: "Email query parameter is required" });
//   }

//   try {
//     const query = { email };

//     // Aggregation pipelines
//     const totalClicksPipeline = [
//       { $match: query },
//       { $unwind: "$redirectionLogs" },
//       { $group: { _id: null, totalClicks: { $sum: 1 } } },
//     ];

//     const dateWiseClicksPipeline = [
//       { $match: { email, "redirectionLogs": { $exists: true, $ne: [] } } },
//       { $unwind: "$redirectionLogs" },
//       {
//         $group: {
//           _id: {
//             $dateToString: {
//               format: "%Y-%m-%d",
//               date: "$redirectionLogs.timestamp",
//               timezone: "Asia/Kolkata",
//             },
//           },
//           clicks: { $sum: 1 },
//         },
//       },
//       { $sort: { _id: -1 } }, // Sort by date ascending to calculate cumulative clicks
//       {
//         $project: {
//           date: "$_id",
//           clicks: 1,
//           _id: 0,
//         },
//       },
//     ];

//     const deviceWiseClicksPipeline = [
//       { $match: query },
//       { $unwind: "$redirectionLogs" },
//       {
//         $group: {
//           _id: "$redirectionLogs.device",
//           clicks: { $sum: 1 },
//         },
//       },
//       {
//         $project: {
//           device: "$_id",
//           clicks: 1,
//           _id: 0,
//         },
//       },
//     ];

//     // Fetch results using Promise.all for parallelism
//     const [totalClicksResult, dateWiseClicksResult, deviceWiseClicksResult] = await Promise.all([
//       Url.aggregate(totalClicksPipeline),
//       Url.aggregate(dateWiseClicksPipeline),
//       Url.aggregate(deviceWiseClicksPipeline),
//     ]);

//     // Extract and format the results
//     const totalClicks = totalClicksResult[0]?.totalClicks || 0;

//     // Calculate cumulative clicks for dateWiseClicks
//     let cumulativeClicks = 0;
//     const dateWiseClicks = dateWiseClicksResult.map((item) => {
//       cumulativeClicks += item.clicks;
//       return {
//         date: item.date,
//         clicks: item.clicks,
//         cumulativeClicks, // Add cumulative clicks to each day's data
//       };
//     });

//     // Format device-wise clicks
//     const deviceWiseClicks = deviceWiseClicksResult.map((item) => ({
//       device: item.device,
//       clicks: item.clicks,
//     }));

//     // Send the response
//     res.status(200).json({
//       totalClicks,
//       dateWiseClicks,
//       deviceWiseClicks,
//     });
//   } catch (error) {
//     console.error("Error fetching clicks data:", error.message || error);
//     res.status(500).json({ error: "Error fetching clicks data" });
//   }
// });

// module.exports = router;


router.get("/clicks", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }

  try {
    const query = { email };

    // Aggregation pipelines
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
      { $sort: { _id: 1 } }, // Sort by date ascending to calculate cumulative clicks
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

    // Fetch results using Promise.all for parallelism
    const [totalClicksResult, dateWiseClicksResult, deviceWiseClicksResult] = await Promise.all([
      Url.aggregate(totalClicksPipeline),
      Url.aggregate(dateWiseClicksPipeline),
      Url.aggregate(deviceWiseClicksPipeline),
    ]);

    // Extract and format the results
    const totalClicks = totalClicksResult[0]?.totalClicks || 0;

    // Calculate cumulative clicks for dateWiseClicks
    let cumulativeClicks = 0;
    const dateWiseClicks = dateWiseClicksResult.map((item) => {
      cumulativeClicks += item.clicks;
      return {
        date: item.date,
        clicks: item.clicks,
        cumulativeClicks, // Add cumulative clicks to each day's data
      };
    });

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
