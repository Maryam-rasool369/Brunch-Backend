const mongoose = require('mongoose')
const { type } = require('os')

const postSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    summary:{
        type:String,
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true
    },
    author:{
        type:mongoose.Schema.Types.ObjectId , ref:'User'
    },
    status:{
        type:String,
        default:'pending'
    }
},{timestamps:true})

const postModel = mongoose.model('Post',postSchema)

module.exports = postModel