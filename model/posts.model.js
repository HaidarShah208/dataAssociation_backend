const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
 {
user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"users"
},
content:{ type: String, required: true },
likes:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"users"
}]
 },

);

const postModel = mongoose.model("posts", postSchema);

module.exports = postModel;
