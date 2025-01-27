const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone:{
        type:String,
        required:true,
        unique:true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("User", userSchema);















// const mongoose = require("mongoose");

// // Define the URL schema (related to users)
// const urlSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User", // Reference to the User model
//         required: true,
//     },
//     url: {
//         type: String,
//         required: true,
//     },
// });

// const Url = mongoose.model("Url", urlSchema);

// // Define the User schema
// const userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     phone: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     password: {
//         type: String,
//         required: true,
//     },
// });

// // Middleware to delete related URLs when a user is deleted
// userSchema.pre("findOneAndDelete", async function (next) {
//     const user = await this.model.findOne(this.getFilter());
//     if (user) {
//         await Url.deleteMany({ userId: user._id }); // Delete all related URLs
//         console.log("Deleted related URLs for user:", user._id);
//     }
//     next();
// });

// module.exports = mongoose.model("User", userSchema);
