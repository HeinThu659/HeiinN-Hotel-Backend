import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rooms",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  checkIn: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Ensure check-in date is not in the past
        return value >= new Date();
      },
      message: "Check-in date cannot be in the past."
    }
  },
  checkOut: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Ensure check-out is after check-in
        return value > this.checkIn;
      },
      message: "Check-out date must be after check-in date."
    }
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Failed", "Cancelled", "Archived"],
    default: "Pending"
  },
  paymentMethod: {
    type: String,
    enum: ["BankTransfer"],
    required: true
  },
  paymentProof: {
    type: String,
    require: [true, "Upload a screenshot or image of your payment"]
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Cancelled"],
    default: "Pending"
  },
  totalPrice: {
    type: Number,
    required: [true, "Total price is required"],
    min: [0, "Total price must be a positive number"]
  },
  specialRequests: {
    type: String,
    default: "None" // Optional field for special requests
  }
}, { timestamps: true });

// Index frequently queried fields for performance
bookingSchema.index({ room: 1, user: 1, status: 1 });

const BookingModel = mongoose.model("Bookings", bookingSchema);
export default BookingModel;