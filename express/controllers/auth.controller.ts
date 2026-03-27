import express from "express";

import { User } from "../../models/User.ts";

export const Register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ succes: false, message: "All fields required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({success:false,message:"User Exists"});
    }

    const user= await new User({
        username,
        password
    })

    user.save();
    console.log(user)

    return res.status(201).json({success:true,message:"Login Please"})

  } catch (error) {
     console.log(error);
     return res.status(400).json({ success: false, message: error.message });
  }
};

export const VendorRegistration = async (req,res)=>{

  const { username,password} =req.body;

  if(!username,!password){
    return res.status(400).json({success:false,message:"All fields required"});
  }

  try {
    const existingVendor = await User.findOne({username});
    if(existingVendor) return res.status(400).json({success:false,message:"Choose new vendorname"});

    const vendor = await new User({
      username,
      password,
      role:"Vendor"
    })

    await vendor.save();
    return res.status(201).json({success:true,message:'Vendor Registration Successfull, Login Please'})
    
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({success:false,message:'Somthing went wrong'})
  }

}