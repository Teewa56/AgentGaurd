import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();    

async function connectDB(){
    try {
        await mongoose.connect(process.env.DATABASE_URL as string);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
        process.exit(1);    
    }
};

export default connectDB;   