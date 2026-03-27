import express from "express"
import 'dotenv/config'

import { connectDB } from "./config/db.ts";
import { AuthRouter } from "./express/routes/auth.routes.ts";
import { ProductRouter } from "./express/routes/products.routes.ts";
const port = process.env.PORT


const app = express();
connectDB();
app.use(express.json());



app.get("/",(req,res)=>{
    res.send('Hekko')
})

app.use('/auth',AuthRouter)
app.use('/product',ProductRouter)

app.listen(port,()=>{
    console.log("Server Running on Port:",port)
})
