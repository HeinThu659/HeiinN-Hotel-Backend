import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middlewares/auth.js';
import { createNewBooking, getAllBookings, updateBookingById, getBookingById, getMyBookings, checkDates } from '../controllers/booking.ctrl.js';

const bookingRouter = express.Router();

bookingRouter
    .get('/all', isAuthenticated, authorizeRoles([1, 2]), getAllBookings)
    .get('/my', isAuthenticated, getMyBookings)
    .get('/one/:id', isAuthenticated, authorizeRoles([1, 2]), getBookingById)
    .get('/booked-dates/:roomId', checkDates)
    .post('/new/:roomId', isAuthenticated, authorizeRoles([0, 2]), createNewBooking)
    .patch('/update/:id', isAuthenticated, authorizeRoles([1, 2]), updateBookingById);

export default bookingRouter;