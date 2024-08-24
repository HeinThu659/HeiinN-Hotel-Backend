import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//USER ROLES...
const USER_ROLES = {
    GUEST: 0,
    MANAGER: 1,
    RECEPTIONIST: 2,
};
// HOUSEKEEPER: 3, coming soon
// SERVER: 4

const userSchema = new mongoose.Schema({
    profilePicture: {
        type: String,
        default: null, // Pfp is optional
    },
    name: {
        type: String,
        required: [true, "name is required"],
        minlength: [5, 'Name must have at least 5 characters']
    },
    normalized_name: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true  // Allows null and multiple docs without field
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, 'Password must have at least 8 characters']
    },
    address: {
        type: String,
        minlength: [15, 'Address must have at least 15 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        minlength: [9, 'Phone number must have at least 9 characters']
    },
    role: {
        type: Number,
        enum: Object.values(USER_ROLES), // Restrict roles to predefined values
        default: USER_ROLES.GUEST // Default role is Guest
    }
}, { timestamps: true });

// Created indexes for faster query performance
userSchema.index({ email: 1 }); // Unique index automatically created
userSchema.index({ role: 1 });
userSchema.index({ name: 1 });
userSchema.index({ normalized_name: 1 });
userSchema.index({ role: 1, createdAt: -1 }); // Compound index for role and creation date

// Middleware to update normalized_name before saving
userSchema.pre('save', function (next) {
    if (!this.isModified('name')) {
        return next();
    }
    // Update normalized_name with lowercase and spaces removed
    this.normalized_name = this.name.toLowerCase().replace(/\s+/g, '');
    next();
});

// HASH PSW B4 SAVING
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//COMPARE PSW
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

//SIGNIN ACCESS TOKEN
userSchema.methods.SigninAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN, {
        expiresIn: '30d',
    });
};

const UserModel = mongoose.model("Users", userSchema);

export default UserModel;