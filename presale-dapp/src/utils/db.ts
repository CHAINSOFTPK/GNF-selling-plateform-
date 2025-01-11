
import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://wajid:wajid@cluster0.0vndb.mongodb.net/sajid?retryWrites=true&w=majority&appName=Cluster0";

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // ...removed process.exit(1) because it won’t work in the browser...
    }
};

export default connectDB;