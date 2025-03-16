import cloudinary from "cloudinary";
import db from "../../models/index.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storeImage = async (req, res) => {
  // return res.status(200).json({ message: "Image uploaded successfully" });
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Get title from request body
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    // Convert the file buffer to base64 string for Cloudinary
    const fileStr = req.file.buffer.toString("base64");
    const fileType = req.file.mimetype;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      `data:${fileType};base64,${fileStr}`,
      {
        folder: "trabajo-terminal",
      }
    );

    const image = await db.Image.create({
      url: uploadResponse.secure_url,
      title: description,
      publicId: uploadResponse.public_id,
      userId: req.user.userId, // Using the userId from the JWT token
    });

    return res.status(201).json({
      message: "Image uploaded successfully",
      image: {
        id: image.id,
        url: image.url,
        title: image.title,
        userId: image.userId,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
