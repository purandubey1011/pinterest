var mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Pinterest-App');
const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: Number,
  image: {
    type: String,
    default: "def.png",
  },
  poster: {
    type: String,
    default: 'poster.png'
  },
  bio: String,
  posts: [
    { type: mongoose.Schema.Types.ObjectId, ref: "post" }
  ],
  comment: [
    { type: mongoose.Schema.Types.ObjectId, ref: "comment" }
  ],
  postsaved: [
    {
      type: mongoose.Schema.Types.ObjectId, ref: "post",
    }
  ],
  follower: [
    {type: mongoose.Schema.Types.ObjectId, ref: "user"}
  ],
  following: [
    {type: mongoose.Schema.Types.ObjectId, ref: "user"}
  ],
})
userSchema.plugin(plm,{usernameField:"email"})
module.exports = mongoose.model('user', userSchema);