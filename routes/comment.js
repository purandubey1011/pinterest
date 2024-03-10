const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema({
    text:{type:String,required:true},
    user:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
    post:{type:mongoose.Schema.Types.ObjectId,ref:"post"},
},{versionKey:false,timestamps:true})

const commentModel = mongoose.model("comment",commentSchema)
module.exports = {commentModel}