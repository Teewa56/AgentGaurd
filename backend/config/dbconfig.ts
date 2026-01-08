import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();    

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL!);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
        process.exit(1);    
    }
};

export default connectDB;