const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    title:String,
    description:String,
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        }
    ],
    date:{
        type:Date,
        default:Date.now()
    },
    pic:String,
    comments:[{
        type:mongoose.Schema.Types.ObjectId,ref:"comment"
    }]
})
module.exports = mongoose.model("post",postSchema);