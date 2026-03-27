import express from 'express'
import { Product } from '../../models/Product.ts'

export const AddProduct = async (req,res)=>{

    const{name,price,category,vendor}=req.body;

    if(!name||!price||!category){
        return res.status(400).json({success:false,message:"All fields Required"})
    }

    try {

        const newProduct =await new Product({
            name,
            price,
            category,
            vendor:Math.random()
        })

        await newProduct.save();

        return res.status(201).json({success:true,message:'Product Added'})
        
    } catch (error) {
        console.log(error)
        return res.status(400).json({success:false,message:"Something went wrong"})
    }
}