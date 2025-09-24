// routes/products.js
const express = require("express");
const Product = require("../models/Product");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "ansari-tools/products",
        resource_type: "auto",
        transformation: [{ width: 500, height: 500, crop: "limit" }]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

// Get all products
router.get("/", async (req, res) => {
  try {
    const { category, isActive = true } = req.query;
    let query = { isActive };
    
    if (category) {
      query.category = category;
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new product
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const productData = req.body;
    
    // If image was uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        productData.image = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }
    
    // Parse variants and features if they're strings
    if (productData.variants && typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants);
    }
    if (productData.features && typeof productData.features === 'string') {
      productData.features = JSON.parse(productData.features);
    }
    if (productData.specifications && typeof productData.specifications === 'string') {
      productData.specifications = JSON.parse(productData.specifications);
    }
    
    const product = new Product(productData);
    await product.save();
    
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update product
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const productData = req.body;
    
    // If new image was uploaded, use Cloudinary URL
    if (req.file) {
      productData.image = req.file.path;
    }
    
    // Parse variants and features if they're strings
    if (productData.variants && typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants);
    }
    if (productData.features && typeof productData.features === 'string') {
      productData.features = JSON.parse(productData.features);
    }
    if (productData.specifications && typeof productData.specifications === 'string') {
      productData.specifications = JSON.parse(productData.specifications);
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload image only
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    
    try {
      const result = await uploadToCloudinary(req.file.buffer);
      res.json({ imageUrl: result.secure_url });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      res.status(500).json({ message: "Image upload failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
