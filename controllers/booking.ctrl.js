import BookingModel from "../models/booking.model.js";
import RoomModel from "../models/room.model.js";
import UserModel from "../models/user.model.js";
import sendBookingNotification from "../utils/notification.js";
import createUploader from "../config/uploadConfig.js";

// Check if a room is available for the specified dates
const checkRoomAvailability = async (room, checkIn, checkOut) => {
    const bookings = await BookingModel.find({ room, checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn } });
    return bookings.length === 0;
};

// GET ALL BOOKINGS (sorting, filtering, pagination)
export const getAllBookings = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            roomNumber,
            userName,
            bookingStatus,
            paymentStatus,
            bookingId // main query
        } = req.query;
        const query = {};

        if (userName) {
            const user = await UserModel.findOne({ normalized_name: userName });
            if (user) {
                query.user = user._id;
            } else {
                return res.status(404).json({
                    status: "fail",
                    message: "User not found"
                });
            }
        }

        if (bookingStatus) {
            query.status = bookingStatus;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        if (roomNumber) {
            const room = await RoomModel.findOne({ room_number: roomNumber });
            if (room) {
                query.room = room._id;
            } else {
                return res.status(404).json({
                    status: "fail",
                    message: "Room not found"
                });
            }
        }

        if (bookingId) {
            query._id = bookingId;
        }

        const currentPage = parseInt(page, 10); // Convert page to number
        const totalBookings = await BookingModel.countDocuments(query);
        const totalPages = Math.ceil(totalBookings / limit);

        if (currentPage > totalPages) {
            return res.status(404).json({
                status: "fail",
                message: "No booking found with such query"
            });
        }

        // Fetch all bookings for the current query
        const allBookings = await BookingModel.find(query)
            .populate('room', 'room_number room_type')
            .populate('user', 'name');

        // Calculate duration for each booking
        const bookingsWithDuration = allBookings.map(booking => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);

            // Ensure dates are valid
            if (isNaN(checkIn) || isNaN(checkOut)) {
                console.log(`Invalid dates for booking ID ${booking._id}: checkIn=${booking.checkIn}, checkOut=${booking.checkOut}`);
                return {
                    ...booking.toObject(),
                    duration: null
                };
            }

            const duration = (checkOut - checkIn) / (1000 * 60 * 60 * 24); // duration in nights
            return {
                ...booking.toObject(),
                duration
            };
        });

        // Sort based on duration
        if (sortOrder === 'longest') {
            bookingsWithDuration.sort((a, b) => b.duration - a.duration);
        } else if (sortOrder === 'shortest') {
            bookingsWithDuration.sort((a, b) => a.duration - b.duration);
        } else {
            bookingsWithDuration.sort((a, b) => {
                if (sortOrder === 'asc') {
                    return a[sortBy] > b[sortBy] ? 1 : -1;
                } else {
                    return a[sortBy] < b[sortBy] ? 1 : -1;
                }
            });
        }

        // Apply pagination
        const paginatedBookings = bookingsWithDuration.slice((currentPage - 1) * limit, currentPage * limit);

        return res.status(200).json({
            status: "success",
            message: "All bookings list received",
            data: paginatedBookings,
            totalBookings,
            totalPages,
            currentPage
        });
    } catch (error) {
        return next(res.status(500).json({ status: "error", message: error.message }));
    }
};

// GET MY BOOKINGS (sorting, filtering, pagination)
export const getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // filtering, sorting, pagination
        const { status, sortBy, orderBy, limit = 10, page = 1 } = req.query;

        let filter = { user: userId };

        if (status) filter.status = status;

        const currentPage = parseInt(page, 10); // Convert page to number
        const totalBookings = await BookingModel.countDocuments(filter);
        const totalPages = Math.ceil(totalBookings / limit);

        if (currentPage > totalPages) {
            return res.status(404).json({
                status: "fail",
                message: "Page Not Found"
            });
        }

        // Fetch all bookings for the current query
        const myBookings = await BookingModel.find(filter)
            .populate('room', 'room_number room_type images')
            .populate('user', 'name');

        if (!myBookings || myBookings.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "No Booking Found"
            });
        }

        // Calculate duration for each booking
        const bookingsWithDuration = myBookings.map(booking => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);

            // Ensure dates are valid
            if (isNaN(checkIn) || isNaN(checkOut)) {
                console.log(`Invalid dates for booking ID ${booking._id}: checkIn=${booking.checkIn}, checkOut=${booking.checkOut}`);
                return {
                    ...booking.toObject(),
                    duration: null
                };
            }

            const duration = (checkOut - checkIn) / (1000 * 60 * 60 * 24); // duration in days
            console.log(`Duration for booking ID ${booking._id}: ${duration} days`);
            return {
                ...booking.toObject(),
                duration
            };
        });

        // Sort based on duration if orderBy is 'longest' or 'shortest'
        if (orderBy === 'longest') {
            bookingsWithDuration.sort((a, b) => b.duration - a.duration);
        } else if (orderBy === 'shortest') {
            bookingsWithDuration.sort((a, b) => a.duration - b.duration);
        } else {
            // Default sorting
            let sort = {};
            if (sortBy) {
                sort[sortBy] = orderBy === "asc" ? 1 : -1;
                bookingsWithDuration.sort((a, b) => {
                    if (a[sortBy] > b[sortBy]) return sort[sortBy];
                    if (a[sortBy] < b[sortBy]) return -sort[sortBy];
                    return 0;
                });
            }
        }

        // Apply pagination
        const paginatedBookings = bookingsWithDuration.slice((currentPage - 1) * limit, currentPage * limit);

        return res.status(200).json({
            status: "success",
            message: "My Bookings",
            data: paginatedBookings,
            totalBookings,
            totalPages,
            currentPage
        });
    } catch (error) {
        return next(res.status(500).json({ status: "error", message: error.message }));
    }
}

// GET ONE BOOKING BY ID
export const getBookingById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const booking = await BookingModel.findById(id)
            .populate('room', 'room_number room_type images')
            .populate('user', 'name');

        if (!booking) {
            return res.status(404).json({
                status: "fail",
                message: "Booking Not Found"
            });
        }

        // Calculate the duration in days
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const duration = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)); // Duration in days

        // Add duration to the booking object
        booking._doc.duration = duration;  // Using ._doc to modify the mongoose document directly

        return res.status(200).json({
            status: "success",
            message: "Booking retrieved successfully",
            data: booking
        });
    } catch (error) {
        return next(res.status(500).json({ status: "error", message: error.message }));
    }
}

// GET THE ROOM'S AVAILABILITY (OPEN OR NOT BY GETTING THE DATES)
export const checkDates = async (req, res, next) => {
    try {
        const id = req.params.roomId;
        // get all the bookings with that room id and select only checkIn and checkOut fields
        const bookings = await BookingModel.find({ room: id }).select('checkIn checkOut -_id');

        if (!bookings) {
            return res.status(404).json({
                status: "fail",
                message: "There are no bookings for this room yet"
            })
        }

        // Extract checkIn/Out dates
        const dates = bookings.map(booking => ({
            checkIn: booking.checkIn,
            checkOut: booking.checkOut
        }));

        // Return the dates in the response
        return res.status(200).json({
            status: 'success',
            data: dates
        });

    } catch (error) {
        return next(res.status(500).json({ status: "error", message: error.message }));
    }
}

// CREATE NEW BOOKING
export const createNewBooking = async (req, res, next) => {
    const upload = createUploader('payment_proofs').single('paymentProof');

    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                status: "fail",
                message: err.message || 'File upload error'
            });
        }

        // Validate that the payment proof file is uploaded
        if (!req.file) {
            return res.status(400).json({
                status: "fail",
                message: "Payment proof is required."
            });
        }

        try {
            const id = req.params.roomId;
            const room = await RoomModel.findById(id);
            if (!room) {
                return res.status(404).json({
                    status: "fail",
                    message: "Room not found"
                });
            }

            const { checkIn, checkOut, paymentMethod, totalPrice, specialRequests } = req.body;

            // Validate payment method
            if (!paymentMethod) {
                return res.status(400).json({
                    status: "fail",
                    message: "Payment method is required."
                });
            }

            const isRoomAvailable = await checkRoomAvailability(room, checkIn, checkOut);
            if (!isRoomAvailable) {
                return res.status(400).json({
                    status: "fail",
                    message: "Room not available for the specified dates"
                });
            }

            // Handle payment proof file
            let paymentProof = req.file.path;

            // Create a new booking
            const newBooking = await BookingModel.create({
                room: room._id,
                user: req.user.id,
                checkIn,
                checkOut,
                status: "Pending",
                paymentMethod,
                paymentProof,
                paymentStatus: "Pending",
                totalPrice,
                specialRequests
            });

            // populate the new booking with room number and user name
            const populatedBooking = await BookingModel.findById(newBooking._id)
                .populate('room', 'room_number')
                .populate('user', 'normalized_name');

            // add booking ref to the room's bookings array
            room.bookings.push(newBooking._id);
            await room.save();

            // send notification
            await sendBookingNotification(newBooking);

            // Calculate the duration in days
            const checkInDate = new Date(newBooking.checkIn);
            const checkOutDate = new Date(newBooking.checkOut);
            const duration = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)); // Duration in days

            return res.status(201).json({
                status: "success",
                message: "Booked successfully",
                data: populatedBooking,
                duration: duration
            });
        } catch (error) {
            return next(res.status(500).json({ status: "error", message: error.message }));
        }
    });
};

// UPDATE BOOKING BY ID (may be in the future, file uploads, checkIn/Out updates will come)
export const updateBookingById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const booking = await BookingModel.findById(id);
        if (!booking) {
            return res.status(404).json({
                status: "fail",
                message: "Booking not found"
            });
        }

        const { checkIn, checkOut, status, paymentMethod, paymentStatus, paymentProof, totalPrice, specialRequests } = req.body;

        if (checkIn) booking.checkIn = checkIn;
        if (checkOut) booking.checkOut = checkOut;
        if (status) booking.status = status;
        if (paymentMethod) booking.paymentMethod = paymentMethod;
        if (paymentStatus) booking.paymentStatus = paymentStatus;
        if (paymentProof) booking.paymentProof = paymentProof;
        if (totalPrice) booking.totalPrice = totalPrice;
        if (specialRequests) booking.specialRequests = specialRequests;

        await booking.save();
        // send notification
        await sendBookingNotification(booking);

        return res.status(200).json({
            status: "success",
            message: "Booking updated successfully",
            data: booking
        });
    } catch (error) {
        return next(res.status(500).json({ status: "error", message: error.message }));
    }
};
