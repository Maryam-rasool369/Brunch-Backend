const mongoose = require('mongoose')
// const { type } = require('os')

const recipeSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    prepTime:{
        type:String,
        required:true,
    },
    cookTime:{
        type:String,
        required:true,
    },
    serves:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true
    },
    // ingredients:{
    //     type:String,
    //     required:true,
    // },
    summary:{
        type:String,
        required:true,
    },
    preparation:{
        type:String,
        required:true,
    },
    author:{
        type:mongoose.Schema.Types.ObjectId , ref:'User'
    },
    status:{
        type:String,
        default:'pending'
    }
},{timestamps:true})

const recipeModel = mongoose.model('Recipe',recipeSchema)

module.exports = recipeModel