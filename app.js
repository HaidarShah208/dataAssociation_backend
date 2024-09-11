const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const userModel = require("./model/user.model");
const bcrypt = require("bcrypt");
const jwt= require("jsonwebtoken");
const cookieParser=require("cookie-parser");
const path=require("path");
const postModel = require("./model/posts.model");
const crypto = require("crypto");
const multer  = require('multer');
app.set("view engine", "ejs");
require("dotenv").config();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());




////////////////////// upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/image/upload')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12,(req,bytes)=>{
      const fn=bytes.toString('hex')+path.extname(file.originalname)
      cb(null, fn)
    })
  }
})
const upload = multer({ storage: storage })

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("login");
});


////////////////////////// uploadImage
app.get('/uploadImage', (req, res) => {
  res.render("uploadImage");
})


app.post('/upload',upload.single('image'),isLoggedIn, async(req, res) => {
  let user=await userModel.findOne({email:req.user.email});
  user.profile=req.file.filename
  await user.save()
  console.log(req.file)
  res.redirect('/profile')
})



////////////////////////// register
app.post("/register", async (req, res) => {
  const { name, email, password, age } = req.body;
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists!');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      age,
    });

    await user.save();

    const token= jwt.sign({email: email},'secret',{ expiresIn: '1h' })
    res.cookie('token',token,{maxAge: 3600000,httpOnly:true})


    res.status(201).json({ message: "User registered successfully", user: user });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(400).json({ message: "Error occurred during user registration", error });
  }

});



////////////////////////// login
app.post("/login", async (req, res) => {
  const {  email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send('you must be registered before login'); 
    }

    bcrypt.compare(password,user.password,(err,result)=>{
      if(result) {
        const token= jwt.sign({email: email},'secret',{ expiresIn: '1h' })
        res.cookie('token',token,{maxAge: 3600000,httpOnly:true})
        res.send('good');

      }
        else res.send('email or password not match')
    })
    


  } catch (error) {
    console.error('Error during registration:', error);
    res.status(400).json({ message: "Error occurred during user login", error });
  }
});


////////////////////////// logout

app.get('/logout',(req, res) => {
  res.cookie('token',"")
  res.redirect('login')
})



// ////////////////////// profile
app.get("/profile", isLoggedIn,async(req, res) => {
  const userData=await userModel.findOne({email:req.user.email}).populate('posts');
  console.log('userss',userData);
  res.render('profile',{userData:userData});
});



// ////////////////////// posts

app.post("/post", isLoggedIn,async(req, res) => {
  const user=await userModel.findOne({email:req.user.email});
  const {content} =req.body;
if (!content) {
    return res.status(400).send('Content is required');
  }
  let post = await postModel.create({
    user:user._id,
    content:content
  })

  user.posts.push(post._id)
  await user.save()

  res.redirect('profile')
});



app.get('/like/:id', isLoggedIn, async(req,res)=>{
  let posts= await postModel.findOne({_id:req.params.id}).populate('user')
  console.log('posts',req.user)
  posts.likes.push(req.user.userid)
  await posts.save()
  res.redirect('/profile')
})




// ////////////////////// edit
app.get('/edit/:id',isLoggedIn, async (req, res) => {
  const posts=await postModel.findOne({_id: req.params.id}).populate('user')
  res.render('edit',{posts})
})
app.post('/update/:id',isLoggedIn, async (req, res) => {
  const postEdit=await postModel.findOneAndUpdate({_id: req.params.id},{content:req.body.content})
  res.redirect('/profile')
})

function isLoggedIn(req, res,next) {
  if (req.cookies.token) {
  jwt.verify(req.cookies.token,'secret',(err,decoded)=>{
      if(err) return res.redirect('login')
      else req.user=decoded
    next()
    })
  } else {
    return res.redirect('login')
  }
}

















mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => {
  console.log("Mongodb occure error : ", error);
});
db.once("open", () => {
  console.log("Mongodb connected sucessfully!");
  const port = process.env.CONNECTION_PORT;
  app.listen(port, () => {
    console.log(`server is running on ${port} port`);
  });
});
