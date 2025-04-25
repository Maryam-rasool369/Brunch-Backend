require('dotenv').config();
const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser= require('cookie-parser')
const { default: mongoose } = require('mongoose')
// This is to save post in the mongodb

const multer = require('multer')
const uploadMiddleware = multer({dest:'./Uploads', limits: {
        fileSize: 5 * 1024 * 1024, // Limit each file to 5MB
        fieldNameSize: 100, // Limit field name size to 100 bytes
        fields: 10, // Limit number of non-file fields to 10
}})
const fs = require('fs')
const User = require('./Models/User')
const Post = require('./Models/Post')
const Recipe = require('./Models/Recipe')
const bcrypt = require('bcryptjs')
const saltRounds = 10; // Salt rounds for hashing
const jwt = require('jsonwebtoken')
// const { concat } = require('lodash')
// const { json } = require('stream/consumers')



const PORT = process.env.PORT || 3001;
const secretKey = process.env.JWT_SECRET;
const clientOrigin = process.env.CLIENT_ORIGIN;

app.use(cors({ credentials: true,methods:["POST","GET","PATCH","PUT","DELETE"] ,origin: clientOrigin }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB Connection Error:', err));

//Middlewares
app.use(express.json())
app.use(cookieParser())
app.use('/Uploads',express.static(__dirname + '/Uploads'))


app.post('/register',async (req, res) => {
    const {firstName,lastName,email,password}= req.body

    
    try {
        const userDocument = await User.create({
            firstName,
            lastName,
            email,
            password:bcrypt.hashSync(password,saltRounds),
            isAdmin: email === 'rasoolmaryam57@gmail.com' ? true : false
        })

        // res.json({userDocument})

        const token = jwt.sign({email:userDocument.email, userId:userDocument._id, isAdmin:userDocument.isAdmin}, secretKey,{})

        res.cookie('token', token).json({ message: 'Registration successful' });
        
    } catch (error) {
        res.status(400).json(error)
    }
    
//   res.json({requestData:{firstName,lastName,email,password}})
})

app.post('/login', async(req, res) => {
    const { email, password } = req.body;
    try {
        const userFound = await User.findOne({email});

        if (!userFound) {
            return res.status(400).json({ errorMessage: 'Invalid email' });
        }

        // Check if the password matches
        const passwordMatched = bcrypt.compareSync(password, userFound.password);

        if (!passwordMatched) {
            return res.status(401).json({ errorMessage: 'Invalid password' });
        }

        
        // Generate JWT Token
        const token = jwt.sign({ email: userFound.email, userId: userFound._id, isAdmin:userFound.isAdmin }, secretKey, {});

        // Send success response
        return res.cookie('token', token).json({ message: 'Login successful' });

    } catch (error) {
        res.status(500).json({ errorMessage: 'Server error', error });
    }
});

app.get('/profile', async(req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ errorMessage: "No token provided" });
    }

    jwt.verify(token, secretKey, (err, info) => {
        if (err) {
            return res.status(401).json({ errorMessage: "Invalid or expired token" });
        }

        res.json(info);
    });
    // res.json(req.cookies);
});

app.post('/logout', (req,res) => {
    res.cookie('token', '').json('Ok')
})

app.post('/post',uploadMiddleware.single('file'), async(req,res)=>{
    const {originalname,path} = req.file;
    const parts =originalname.split('.')
    const extention =parts[parts.length - 1]
    const newPath = path+'.'+extention
    fs.renameSync(path, newPath)

    const { token } = req.cookies;
    jwt.verify(token, secretKey, async(err, info) => {
        if (err) {
            return res.status(401).json({ errorMessage: "Invalid or expired token" });
        }
        const {title,summary,content} = req.body
        const postDocument = await Post.create({
            title,
            summary,
            content,
            image:newPath,
            author:info.userId
        })
        res.json(postDocument)
        // res.json(info);
    });
    // res.json(req.file)
})

app.get('/post',async(req,res)=>{
    const posts = await Post.find()
    .populate('author','firstName lastName email')
    .sort({createdAt:-1})//new to old
    // .limit(20)
    res.json(posts)
})

app.get('/post/:id',async(req,res)=>{
    const {id} = req.params
    const postDocument = await Post.findById(id).populate('author','firstName lastName email')
    res.json(postDocument)
})

app.put('/post',uploadMiddleware.single('file'), async(req,res)=>{
    let newPath = null;
    if (req.file) {
        const {originalname,path} = req.file;
        const parts =originalname.split('.')
        const extention =parts[parts.length - 1]
        newPath = path+'.'+extention
        fs.renameSync(path, newPath)
    }
    
    const { token } = req.cookies;
    jwt.verify(token, secretKey, async(err, info) => {
        if (err) {
            return res.status(401).json({ errorMessage: "Invalid or expired token" });
        }
        const {id,title,summary,content} = req.body
        const postDocument = await Post.findById(id)
        if(JSON.stringify(info.userId) === JSON.stringify(postDocument.author))
        {
                const editPostDocument = await Post.findByIdAndUpdate(
                id,
                {
                    title,
                    summary,
                    content,
                    image: newPath ? newPath : postDocument.image,
                },
                {new:true}
            )
            res.json(editPostDocument)
            // res.json({info,authorId});
        }
        
    });
    // res.json(req.file)
})

app.patch('/post/:id', async(req,res)=>{
    const {id} = req.params
    const { token } = req.cookies;
    jwt.verify(token, secretKey, async(err, info) => {
        if (err) {
            return res.status(401).json({ errorMessage: "Invalid or expired token" });
        }
               
        const isAdmin = info.isAdmin
        if(isAdmin)
        {
                const changeStatus = await Post.findByIdAndUpdate(
                id,
                {
                    status:'approved'
                },
                {new:true}
            )
            res.json(changeStatus)
            
        }
        
    });

})

app.delete('/post/:id', async(req,res)=>{
    const {id} = req.params
    const { token } = req.cookies;
    jwt.verify(token, secretKey, async(err, info) => {
        if (err) {
            return res.status(401).json({ errorMessage: "Invalid or expired token" });
        }
               
        const isAdmin = info.isAdmin
        if(isAdmin)
        {
                const deletePost = await Post.deleteOne({_id:id})
                res.json(deletePost)
        }
        
    });

})

app.post('/recipe', uploadMiddleware.single('file'), async(req,res)=>{
    const {originalname,path} = req.file;
    const parts =originalname.split('.')
    const extention =parts[parts.length - 1]
    const newPath = path+'.'+extention
    fs.renameSync(path, newPath)

    const { token } = req.cookies;
    jwt.verify(token, secretKey, async(err, info) => {
        if (err) {
            return res.status(401).json({ errorMessage: "Invalid or expired token" });
        }
        const {title,prepTime,cookTime,serves,summary,preparation} = req.body
        const recipeDocument = await Recipe.create({
            title,
            prepTime,
            cookTime,
            serves,
            summary,
            preparation,
            image:newPath,
            author:info.userId
        })
        res.json(recipeDocument)
        // res.json(info);
    });
}
)

app.get('/recipe',async(req,res)=>{
    const recipes = await Recipe.find()
    .populate('author','firstName lastName email')
    .sort({createdAt:-1})//new to old
    // .limit(20)
    res.json(recipes)
})

app.get('/recipe/:id',async(req,res)=>{
    const {id} = req.params
    const recipeDocument = await Recipe.findById(id).populate('author','firstName lastName email')
    res.json(recipeDocument)
})

app.patch('/recipe/:id', async(req,res)=>{
    const {id} = req.params
    const { token } = req.cookies;
    jwt.verify(token, secretKey, async(err, info) => {
        if (err) {
            return res.status(401).json({ errorMessage: "Invalid or expired token" });
        }
               
        const isAdmin = info.isAdmin
        if(isAdmin)
        {
                const changeStatus = await Recipe.findByIdAndUpdate(
                id,
                {
                    status:'approved'
                },
                {new:true}
            )
            res.json(changeStatus)
            
        }
        
    });

})

app.delete('/recipe/:id', async(req,res)=>{
    const {id} = req.params
    const { token } = req.cookies;
    jwt.verify(token, secretKey, async(err, info) => {
        if (err) {
            return res.status(401).json({ errorMessage: "Invalid or expired token" });
        }
               
        const isAdmin = info.isAdmin
        if(isAdmin)
        {
                const deleteRecipe = await Recipe.deleteOne({_id:id})
                res.json(deleteRecipe)
        }
        
    });

})

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
  







