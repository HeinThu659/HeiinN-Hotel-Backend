import createUploader from "../config/uploadConfig.js";
import UserModel from "../models/user.model.js";

//REGISTER
export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;
        const emailExists = await UserModel.findOne({ email });
        if (emailExists) {
            return res.status(400).json({
                status: "fail",
                message: "Email already exists"
            });
        }
        const newUser = await UserModel.create({ name, email, password, phone });
        return res.status(201).json({
            status: "success",
            message: "New user created",
            data: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        return next(res.status(500).json({
            status: "error",
            message: error.message
        }));
    }
};

//LOGIN
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                status: "fail",
                error: "Both email and password are required"
            });
        }
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "Email has not registered"
            });
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                status: "fail",
                message: "Wrong Password"
            });
        }

        const accessToken = user.SigninAccessToken();
        res.status(200).json({
            status: "success",
            message: "logged in successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            },
            accessToken,
        })
    } catch (error) {
        return next(res.status(500).json({
            status: "error",
            message: error.message
        }));
    }
}

//GET USER INFO (MY Profile)
export const getUserInfo = async (req, res, next) => {
    try {
        const id = req.user?._id;
        const user = await UserModel.findById(id);
        if (!user) {
            return res.status(404).json({
                status: "failed",
                message: "No user with that id"
            });
        }
        res.status(200).json({
            status: "success",
            message: "User info retrieved successfully",
            data: {
                id: user._id,
                name: user.name, 
                profilePicture: user.profilePicture,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });
    } catch {
        return next(res.status(500).json({
            status: "error",
            message: error.message
        }));
    };
};

//UPLOAD PFP
export const uploadPfp = (req, res, next) => {
    const upload = createUploader('profile_pics').single('profilePicture');

    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                status: "fail",
                message: err.message || 'File upload error'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: "fail",
                message: "No file selected!"
            });
        }

        try {
            const user = await UserModel.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    status: "fail",
                    message: 'User not found'
                });
            }

            const filePath = req.file.path; // Cloudinary URL
            user.profilePicture = filePath;
            await user.save();

            console.log('File uploaded successfully', filePath);

            return res.status(200).json({
                status: "success",
                message: "Profile picture uploaded!",
                data: user,
            });
        } catch (error) {
            console.error('Error saving user data:', error);
            return next(res.status(500).json({
                status: "error",
                message: error.message
            }));
        }
    });
};

//UPDATE USER INFO
export const updateUserInfo = async (req, res, next) => {
    try {
        const id = req.user._id;
        const { name, phone, address } = req.body;

        // Prepare the update fields
        const updateFields = { phone, address };

        if (name) {
            updateFields.name = name;
            updateFields.normalized_name = name.toLowerCase().replace(/\s+/g, '');
        }

        const user = await UserModel.findByIdAndUpdate(id, updateFields, { new: true });
        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }
        await user.save();

        return res.status(200).json({
            status: "success",
            message: "Info updated successfully",
            data: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        return next(res.status(500).json({
            status: "error",
            message: error.message
        }));
    };
};

//UPDATE USER PSW
export const updateUserPsw = async (req, res, next) => {
    try {
        const id = req.user._id;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                status: "fail",
                message: "Enter both old and new passwords"
            });
        }
        const user = await UserModel.findById(id);
        const isPswMatch = await user?.comparePassword(oldPassword);
        if (!isPswMatch) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid old password"
            });
        }
        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            status: "success",
            message: "Password updated successfully",
            data: user
        });

    } catch (error) {
        return next(res.status(500).json({
            status: "error",
            message: error.message
        }));
    }
}

//GET ALL USERS FOR MANAGER ROLE WITH FILTERING, SORTING, & PAGINATION
export const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filterByRole, name } = req.query;
        const query = {}

        if (filterByRole) {
            query.role = filterByRole;
        }
        if (name) {
            // Construct a case-insensitive regex pattern for the entire name query
            const regexPattern = new RegExp(name.split('').map(char => `(?=.*${char})`).join(''), 'i');
            query.$or = [
                { name: regexPattern },
                { normalized_name: regexPattern }
            ];
        }

        const currentPage = parseInt(page, 10); // Convert page to number


        const totalUsers = await UserModel.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        if (currentPage > totalPages) {
            return res.status(404).json({
                status: "fail",
                message: "Page Not Found"
            });
        }

        const users = await UserModel.find(query)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((currentPage - 1) * limit)
            .limit(parseInt(limit));

        return res.status(200).json({
            status: "success",
            message: "All users list received",
            data: users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            })),
            totalUsers,
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

//DELETE USERS FOR MANAGER ROLE
export const deleteUserByID = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await UserModel.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "User deleted successfully"
        });
    } catch (error) {
        return next(res.status(500).json({
            status: "error",
            message: error.message
        }));
    };
};