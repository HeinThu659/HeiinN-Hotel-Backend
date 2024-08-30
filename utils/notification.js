import { createTransporter } from "./googleAuth.js";
import UserModel from "../models/user.model.js";
import RoomModel from "../models/room.model.js";

const sendBookingNotification = async (booking) => {
    try {
        const transporter = await createTransporter();

        const user = await UserModel.findById(booking.user);
        if (!user) {
            throw new Error('User not found');
        }

        const room = await RoomModel.findById(booking.room);
        if (!room) {
            throw new Error('Room not found');
      }

        const mailOptions = {
            from: process.env.GMAIL_SENDER,
            to: [user.email, process.env.GMAIL_SENDER], // Sending email to user and notify the sender, too
            subject: `Booking ${booking.status}`,
            text: `🌻 Your booking has been ${booking.status}! 🌻
                    Booking Details:
                    Your booking id: ${booking._id}
                    Booked by: ${user.name}
                    Room number: ${room.room_number}
                    Check-in: ${booking.checkIn}
                    Check-out: ${booking.checkOut}
                    Total Price: ${booking.totalPrice}
                    Booking status: ${booking.status}
                    Payment method: ${booking.paymentStatus}
                    Payment status: ${booking.paymentMethod}`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="text-align: center;">
                  <img src="https://i.imgur.com/qNeYNbc.png" alt="Hotel Logo" style="max-width: 350px; margin-inline: auto; margin-bottom: 20px;">
                </div>
                <h2 style="color: #0066cc;">Booking ${booking.status}</h2>
                <p>Dear ${user.name} ${user.profilePicture ? `<img style="width: 40px; height: 40px; border-radius: 50%; display: inline;" src="${user.profilePicture}">`: ``},</p>
                <p>Thank you for choosing our hotel. Here are the details of your booking:</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Booking id:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${booking._id}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Booking by:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${user.name}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Room number:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${room.room_number}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Check-in:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(booking.checkIn).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Check-out:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(booking.checkOut).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Total Price:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${booking.totalPrice}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Booking status:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${booking.status}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Payment method:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${booking.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Payment status:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${booking.paymentStatus}</td>
                  </tr>
                </table>
                ${booking.paymentProof ? `
                  <p style="margin-top: 20px;">Attached is the proof of payment:</p>
                  <div style="text-align: center;">
                    <img src="${booking.paymentProof}" alt="Payment Proof" style="max-width: 400px; margin-top: 20px;">
                  </div>` : ''}
                <p style="margin-top: 20px;">We look forward to hosting you. If you have any questions or need further assistance, please do not hesitate to contact us.</p>
                <p>Best regards,</p>
                <p><strong>HeiinN Hotel</strong></p>
                <p><a href="https://heiin-n-hotel.vercel.app/home" style="color: #0066cc;">Visit our website</a></p>
            </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent');
    } catch (error) {
        console.error('Failed to send notification email:', error);
    }
};

export default sendBookingNotification;
