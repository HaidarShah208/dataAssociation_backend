const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    age: { type: String, required: true },
    profile:{
      type:String,
      default:'default.png'
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
      },
    ],
  },

);

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
