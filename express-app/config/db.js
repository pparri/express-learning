import mongoose from "mongoose";

export const connectDB = async () => {
    
    const MONGODB_URI = 'mongodb+srv://aleixparrilla_db_user:cPQkZG7rZR1NNaHm@cluster0.pffxqxe.mongodb.net/?appName=Cluster0'
    //Await es para que espere a que se conecte antes de seguir con el código
    await mongoose.connect(MONGODB_URI).then(() => {
        console.log('Connected to MongoDB');
    })
}