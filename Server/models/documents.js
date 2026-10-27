const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        content: {
            type: String,
            required: [true, "Content is required"],
            trim: true,
        },
        category: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true
    }

)

module.exports = mongoose.model("Documents" ,documentSchema)