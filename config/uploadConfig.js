import cloudinary from '../cloudinaryConfig.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';

// Function to create a new Multer instance with dynamic folder name
const createUploader = (folderName) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: folderName,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            public_id: (req, file) => {
                const ext = path.extname(file.originalname);
                const name = path.basename(file.originalname, ext);
                return name;
            }
        },
    });

    return multer({
        storage: storage,
        limits: { fileSize: 2000000 }, // 2 MB limit
        fileFilter: (req, file, cb) => {
            const filetypes = /jpeg|jpg|png|gif|webp/;
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = filetypes.test(file.mimetype);

            if (extname && mimetype) {
                cb(null, true);
            } else {
                cb(new Error("Error: Images Only!"));
            }
        }
    });
};

export default createUploader;
