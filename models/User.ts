import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        default:'User',
        enum:['Admin','Vendor','User']
    },
    isVerified:{
        type:Boolean,
        default:false
    }
},{minimize:false})

export const User =  mongoose.model('User',UserSchema)