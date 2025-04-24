const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
        minlength:6,
    },
    isAdmin:{
        type:Boolean,
        default:false
    }
},{timestamps:true})

const userModel = mongoose.model('User',userSchema)

module.exports = userModel;