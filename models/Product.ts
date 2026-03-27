import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        default:'Uncategorized',
        enum:['Drugs','Weapons','Data']
    },
    vendor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Vendor',
        required:true
    }
})

export const Product = mongoose.model('Product',ProductSchema)