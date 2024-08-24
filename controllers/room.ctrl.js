import RoomModel from "../models/room.model.js";
import createUploader from "../config/uploadConfig.js";

// Uploader instance for room images (Post/ Patch)
const upload = createUploader('room_images').array('images');

// GET ALL ROOMS WITH FILTERING, SORTING, & PAGINATION
export const getAllRoom = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            roomType,
            status,
            minPrice,
            maxPrice,
            roomNumber,
            capacity,
            floor
        } = req.query;

        const query = {};

        // Check if room number is provided, if yes, prioritize it
        if (roomNumber) {
            query.room_number = { $regex: new RegExp(roomNumber, 'i') };
        } else {
            // Only set other filters if room number is not provided
            if (roomType) {
                query.room_type = roomType;
            }
            if (status) {
                query.status = status;
            }
            if (minPrice) {
                query.price = { $gte: minPrice };
            }
            if (maxPrice) {
                query.price = { ...query.price, $lte: maxPrice };
            }
            if (capacity) {
                query.capacity = capacity;
            }
            if (floor) {
                query.floor = floor;
            }
        }

        const currentPage = parseInt(page, 10); // Convert page to number

        const totalRooms = await RoomModel.countDocuments(query);
        const totalPages = Math.ceil(totalRooms / limit);

        if (currentPage > totalPages) {
            return res.status(404).json({
                status: "fail",
                message: "Page Not Found"
            });
        }

        const rooms = await RoomModel.find(query)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((currentPage - 1) * limit)
            .limit(parseInt(limit));

        return res.status(200).json({
            status: "success",
            message: "All rooms received",
            data: rooms.map(room => ({
                id: room._id,
                room_number: room.room_number,
                room_type: room.room_type,
                price: room.price,
                status: room.status, 
                images: room.images, 
                description: room.description,
                floor: room.floor,
                capacity: room.capacity,
                amenities: room.amenities
            })),
            totalRooms,
            totalPages,
            currentPage
        });
    } catch (error) {
        return next(res.status(500).json({ 
            status: "error", 
            message: error.message
        }));
    }
};

// GET ROOM BY ID
export const getRoomByID = async (req, res, next) => {
    try {
        const id = req.params.id;
        const room = await RoomModel.findById(id);
        if (!room) {
            return res.status(404).json({
                status: "fail",
                message: "Room Not Found"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Room retrieved successfully",
            data: {
                id: room._id,
                room_number: room.room_number,
                room_type: room.room_type,
                price: room.price,
                status: room.status,
                images: room.images,
                description: room.description,
                floor: room.floor,
                capacity: room.capacity,
                amenities: room.amenities
            }
        });
    } catch (error) {
        return next(res.status(500).json({ 
            status: "error", 
            message: error.message 
        }));
    }
}

//POST NEW ROOM
export const createNewRoom = async (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                status: "fail",
                message: err.message || 'File upload error'
            });
        }
        try {
            const { room_number, room_type, price, description, status, floor, capacity, amenities } = req.body;
            const isRoomExists = await RoomModel.findOne({ room_number });
            if (isRoomExists) {
                return res.status(400).json({
                    status: "fail",
                    message: "Room with this room number already exists. Please choose another room number"
                });
            }
            // Prepare images array
            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map(file => file.path);
            }
            
            // create a new room
            const newRoom = await RoomModel.create({
                room_number,
                room_type,
                price,
                description,
                status,
                images,
                floor,
                capacity,
                amenities
            });
            return res.status(201).json({
                status: "success",
                message: "Room successfully created",
                data: {
                    id: newRoom._id,
                    room_number: newRoom.room_number,
                    room_type: newRoom.room_type,
                    price: newRoom.price,
                    status: newRoom.status
                }
            });
        } catch (error) {
            return next(res.status(500).json({ 
                status: "error", 
                message: error.message 
            }));
        }
    });
}

//UPDATE ROOM INFO
export const updateRoom = async (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                status: "fail",
                message: err.message || 'File upload error'
            });
        }

        try {
            const id = req.params.id;

            // Extract fields from the request body
            const { room_number, room_type, price, description, floor, capacity, amenities, status, images } = req.body;

            // Initialize the update object
            const updateData = {
                room_number,
                room_type,
                price,
                description,
                floor,
                capacity,
                amenities,
                status,
                images
            };

            // Handle image uploads
            if (req.files && req.files.length > 0) {
                const images = req.files.map(file => file.path); // Cloudinary URLs
                updateData.images = images;
            }

            // Update the room in the database
            const room = await RoomModel.findByIdAndUpdate(id, updateData, { new: true });

            if (!room) {
                return res.status(404).json({
                    status: "fail",
                    message: "Room not found"
                });
            }

            return res.status(200).json({
                status: "success",
                message: "Successfully updated room",
                data: {
                    id: room._id,
                    room_number: room.room_number,
                    room_type: room.room_type,
                    price: room.price,
                    status: room.status
                }
            });
        } catch (error) {
            return next(res.status(500).json({ 
                status: "error", 
                message: error.message 
            }));
        }
    });
};

//DELETE ROOM
export const deleteRoomByID = async (req, res, next) => {
    try {
        const id = req.params.id;
        const room = await RoomModel.findByIdAndDelete(id);
        if (!room) {
            return res.status(404).json({
                status: "fail",
                message: "Room not found"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Room deleted successfully"
        });
    } catch (error) {
        return next(res.status(500).json({ 
            status: "error", 
            message: error.message 
        }));
    };
};