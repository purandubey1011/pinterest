var express = require('express');
var router = express.Router();
const passport = require('passport');
var multer = require('multer')
var path = require('path')
var fs = require('fs')

var userModel = require("./users");
var postModel = require("./post");
const {commentModel} = require("./comment")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/profileImg')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)+path.extname(file.originalname)
    cb(null, uniqueSuffix )
  }
})

const upload = multer({ storage: storage })

var localStrategy = require('passport-local');
passport.use(new localStrategy({usernameField:"email"},userModel.authenticate()));

router.get('/', function (req, res, next) {
  if (req.session.passport) {
    res.redirect('/home');
  }
  else {
    res.render('index');
  }
});

router.post('/sign-up', function (req, res, next) {
  userModel
    .findOne({ username: req.body.username })
    .then(function (founduser) {
      if (founduser) {
        res.send('username is exist')
      } else {
        var newuser = new userModel({
          username: req.body.username,
          email: req.body.email,
          image: req.body.image,
          poster: req.body.poster,
          bio: req.body.bio
        })
        userModel.register(newuser, req.body.password)
          .then(function (u) {
            passport.authenticate('local')(req, res, function () {
              res.redirect('/home')
            })
          })
      }
    })
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login',
}), function (req, res, next) {
});

router.get('/login', function (req, res, next) {
  if (req.session.passport) {
    res.redirect('/home');
  }
  else {
    res.render('login');
  }
});


router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/login');
  }
}

router.get('/home', isLoggedIn, function (req, res, next) {
  console.log(req.session.passport.user.username) 
  userModel.findOne({_id:req.user._id})
  .then(function(foundUser){
    postModel
    .find()
    .populate("userid")
      .then(function (allposts) {
        res.render("home", { allposts, foundUser });
      });
  })
});

router.get('/profile', isLoggedIn, function (req, res, next) {
  userModel.findOne({ _id:req.user._id })
    .populate("posts")
    .then(function (foundUser) {
      res.render('profile', { foundUser });
    })
});

const posterstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/poster')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const posterupload = multer({ storage: posterstorage })

router.post('/upload', isLoggedIn, posterupload.single("poster"), function (req, res, next) {
  userModel
    .findOne({ _id:req.user._id })
    .then(function (foundUser) {
      if (foundUser.poster !== 'poster.png') {
        fs.unlinkSync(`./public/images/poster/${foundUser.poster}`);
      }
      foundUser.poster = req.file.filename;
      foundUser.save()
        .then(function () {
          res.redirect("back");
        })
    });
});


const postStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/post')
  },
  filenqaame: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
    cb(null, uniqueSuffix)
  }
})

const postUpload = multer({ storage: postStorage })

router.post('/post', postUpload.single("pic"), isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ _id:req.user._id })
    .then(function (user) {
      postModel.create({
        userid: user._id,
        pic: req.file.filename,
        type: req.file.mimetype,
        title: req.body.title,
        description: req.body.description
      })
        .then(function (post) {
          user.posts.push(post._id);
          user.save()
            .then(function () {
              res.redirect("/profile");
            })
        })
    })
});

router.get('/like/:postid', isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ _id:req.user._id })
    .then(function (user) {
      postModel
        .findOne({ _id: req.params.postid })
        .then(function (post) {
          if (post.likes.indexOf(user._id) === -1) {
            post.likes.push(user._id);
          }
          else {
            post.likes.splice(post.likes.indexOf(user._id), 1);
          }
          post.save()
            .then(function () {
              res.redirect("back");
            })
        })
    })
});

router.post('/comment/:id', isLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.id)
  const comment = await commentModel.create({text:req.body.text,post:req.params.id,user:req.user._id})
  post.comments.push = comment
  await post.save()
  await post.save()
  res.redirect("back")
});



router.get('/save', isLoggedIn,async function (req, res, next) {
  const foundUser = await userModel.findById(req.user._id).populate("postsaved")
    res.render('save', { foundUser });
});

router.get("/save/:postid",isLoggedIn, async (req,res)=>{
  const foundUser = await userModel.findOne({ _id:req.user._id })
  const post = await postModel.findById(req.params.postid)
  if(foundUser.postsaved.indexOf(post._id) == -1){
    foundUser.postsaved.push(post._id)
  }else{
    foundUser.postsaved.splice(post._id,1);
  }
  await foundUser.save()
  console.log(post);
  res.redirect("/save")
})

router.get('/follower/:userid', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ _id:req.user._id })
  const flwing = await userModel.findById(req.params.userid)

  if (user.following.indexOf(flwing._id) == -1) {
    user.following.push(flwing._id)
    flwing.follower.push(user._id)
  } else {
    user.following.splice(flwing.follower.indexOf(user._id), 1)
    flwing.follower.splice(user.following.indexOf(flwing._id), 1)
  }
  await user.save()
  await flwing.save()
  console.log({user,flwing})
  res.redirect("back");
})

router.get('/create', isLoggedIn, function (req, res, next) {
  userModel.findOne({ _id:req.user._id })
    .then(function (foundUser) {
      res.render('create', { foundUser });
    })
});

router.get('/editProfile', isLoggedIn, function (req, res, next) {
  userModel.findOne({ _id:req.user._id })
    .then(function (foundUser) {
      res.render('editProfile', { foundUser });
    })
});

router.post('/edit', isLoggedIn, upload.single("image"), async function (req, res, next) {
  var foundUser = await userModel.findOneAndUpdate({ _id:req.user._id },
    { username: req.body.username, email: req.body.email, bio: req.body.bio },
    { new: true }
  );
  if (req.file) {
    foundUser.image = req.file.filename;
  }
  await foundUser.save();
  res.redirect('/profile')
});

router.get('/showpost/:postid', isLoggedIn,async function (req, res, next) {
  const foundUser = await userModel.findOne({ _id:req.user._id })
  const post = await postModel.findById(req.params.postid).populate("userid")
  const comments = await commentModel.find({post:req.params.postid}).populate("user")
  console.log(post)
    res.render("showpost",{foundUser,post,comments});
});

router.get('/account', isLoggedIn, async function (req, res, next) {
  let userCheck = await userModel.findOne({ _id:req.user._id })
  let foundUser = await userModel.findOne({ _id: req.query.username }).populate("posts")
  if (userCheck.username == foundUser.username) {
    res.redirect("/profile")
  } else {
    res.render("other-user-profile", { foundUser })
  }
});

router.get('/sign', function (req, res, next) {
  res.render('sign');
});

router.get('/login', function (req, res, next) {
  res.render('login');
});

module.exports = router;
