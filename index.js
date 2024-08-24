import express from 'express';
import cors from "cors";
import 'dotenv/config.js';
import userRouter from './routers/user.route.js';
import roomRouter from './routers/room.route.js';
import bookingRouter from './routers/booking.route.js';
import { connectDB } from './utils/connect.db.js';




const app = express();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
app.use(express.json({ limit: "50mb" }));
app.use(cors({ origin: "*" }));
app.use(express.json());
//USER ROUTER
app.use("/api/v1/auth", userRouter);
app.use("/api/v1/users", userRouter);

//ROOM ROUTER
app.use("/api/v1/rooms", roomRouter);

//BOOKING ROUTER
app.use("/api/v1/bookings", bookingRouter);


// HEALTH CHECK
app.get("/", (req, res) => {
    return res.status(200).json({
        message: "api working..."
    });
});


app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    connectDB();
});