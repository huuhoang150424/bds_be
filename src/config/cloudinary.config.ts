import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import "dotenv/config";


cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_KEY!,
  api_secret: process.env.CLOUDINARY_SECRET!,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req, file) => ({
    folder: "app_ql", 
    format: file.mimetype.split("/")[1],
    public_id: file.originalname.split(".")[0], 
  }),
});


const uploadCloud = multer({ storage });
export default uploadCloud;
