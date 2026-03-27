import mongoose from "mongoose";
import 'dotenv/config'

const url =  process.env.MONGO_URL
export const connectDB =async ()=>{
    try {
        await mongoose.connect(url)
        console.log('Database Connected')
    } catch (error:any) {
        console.log('Error Connecting Database: ', error.message)  
    }
}