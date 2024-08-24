import mongoose from 'mongoose';

// add migrations here

export const connectDB = async () => {
    try {
        await mongoose
    .connect(process.env.DB_URL)
    .then(async (data) => {
        console.log(`db connected successfully with ${data.connection.host}`);
    });
    } catch (error) {
        console.log(error.message);
    }
} 
