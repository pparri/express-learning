import mongoose from "mongoose";

export const connectDB = async () => {
    
    const MONGODB_URI = 'your mongodb connection string here';
    //Await es para que espere a que se conecte antes de seguir con el código
    await mongoose.connect(MONGODB_URI).then(() => {
        console.log('Connected to MongoDB');
    })
}