import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    room_number: {
        type: String,
        required: [true, "Please enter a room number"],
        unique: [true, "Room numbers cannot be duplicated"]
    },
    room_type: {
        type: String,
        enum: ["Suite", "Superior", "Deluxe", "Standard"], // Enum for room types
        required: [true, "Please enter what type of room it is"]
    },
    price: {
        type: Number,
        required: [true, "Please enter the price of this room"],
        min: [0, "Price must be a positive number"]
    },
    status: {
        type: String,
        enum: ["Available", "Maintenance", "Unavailable"], // Enum for room status
        default: "Available",
        required: true
    },
    images: {
        type: [String],
        default: [] // Default value for images
    },
    description: {
        type: String,
        required: [true, "Please provide a description for the room"]
    },
    floor: {
        type: Number,
        required: [true, "Please specify the floor number"]
    },
    capacity: {
        type: Number,
        required: [true, "Please specify the maximum number of guests"],
        min: [1, "Capacity must be at least 1 guest"]
    },
    amenities: {
        type: [String],
        default: [] // List of amenities available in the room
    },
    bookings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bookings"
    }]
}, { timestamps: true });

// Virtual to count bookings
roomSchema.virtual('bookingCount').get(function () {
    return this.bookings.length;
});

// Index frequently queried fields for performance
roomSchema.index({ room_number: 1 }); // Unique index already applied by setting unique: true
roomSchema.index({ status: 1 });
roomSchema.index({ price: 1 });
roomSchema.index({ room_type: 1 });
roomSchema.index({ room_type: 1, status: 1, price: 1 }); // Compound index for filtering and sorting

const RoomModel = mongoose.model("Rooms", roomSchema);
export default RoomModel;