// scripts/migrateProducts.js
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { connectDB } = require("../src/db");
require('dotenv').config();

// Product data from your frontend
const productsData = [
  {
    name: "ChatGPT Pro",
    description: "Advanced AI conversations with GPT-4, faster responses, and priority access to the latest features. Perfect for professionals, students, and anyone who wants to unlock the full potential of AI assistance.",
    price: "Rs 2000",
    originalPrice: "Rs 2500",
    duration: "/month",
    image: "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/ansari-tools/products/chatgpt-pro.jpg",
    badge: "Most Popular",
    rating: 4.9,
    reviews: 1250,
    hasVariants: true,
    variants: [
      {
        id: "semi-private",
        name: "Semi Private",
        price: "Rs 2000",
        originalPrice: "Rs 2500",
        priceNumber: 2000,
        duration: "/month",
        description: "Shared access with enhanced performance",
        features: [
          "GPT-4 Access with latest model updates",
          "Enhanced Performance", 
          "Faster Response Times",
          "Advanced Features",
          "Standard Support",
        ]
      },
      {
        id: "private",
        name: "Private Account", 
        price: "Rs 4500",
        originalPrice: "Rs 5000",
        priceNumber: 4500,
        duration: "/month",
        description: "Dedicated private access with maximum privacy",
        features: [
          "Dedicated GPT-4 Access",
          "Maximum Privacy & Security",
          "Fastest Response Times",
          "All Advanced Features",
          "Priority 24/7 Support",
          "Custom Instructions",
        ]
      }
    ],
    features: [
      "GPT-4 Access with latest model updates",
      "Enhanced Performance", 
      "Faster Response Times",
      "Advanced Features",
      "Standard Support",
    ],
    specifications: [
      { label: "Model", value: "GPT-4 Turbo" },
      { label: "Response Speed", value: "2x Faster" },
      { label: "Monthly Queries", value: "Unlimited" },
      { label: "Support", value: "Priority 24/7" },
      { label: "Updates", value: "Real-time" },
    ],
    category: "AI Tools"
  },
  {
    name: "Canva Pro",
    description: "Professional design tools with premium templates, background remover, and unlimited exports. Create stunning designs for social media, presentations, and marketing materials with ease.",
    price: "Rs 300",
    originalPrice: "Rs 400", 
    duration: "/6 months",
    image: "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/ansari-tools/products/canva-pro.jpg",
    badge: "Best Value",
    rating: 4.8,
    reviews: 980,
    hasVariants: true,
    variants: [
      {
        id: "6-months",
        name: "6 Months Plan",
        price: "Rs 300",
        originalPrice: "Rs 400",
        priceNumber: 300,
        duration: "/6 months",
        description: "Perfect for short-term projects",
        features: [
          "100,000+ Premium Templates",
          "Magic Background Remover",
          "Magic Resize for all platforms", 
          "Brand Kit with custom colors & fonts",
          "Unlimited Cloud Storage",
          "Premium stock photos & videos",
        ]
      },
      {
        id: "1-year",
        name: "1 Year Plan",
        price: "Rs 500",
        originalPrice: "Rs 700",
        priceNumber: 500,
        duration: "/year",
        description: "Best value for long-term use",
        features: [
          "100,000+ Premium Templates",
          "Magic Background Remover", 
          "Magic Resize for all platforms",
          "Brand Kit with custom colors & fonts",
          "Unlimited Cloud Storage",
          "Premium stock photos & videos",
          "Animation & video editing tools",
          "Team collaboration features"
        ]
      }
    ],
    features: [
      "100,000+ Premium Templates",
      "Magic Background Remover",
      "Magic Resize for all platforms", 
      "Brand Kit with custom colors & fonts",
      "Unlimited Cloud Storage",
      "Premium stock photos & videos",
    ],
    specifications: [
      { label: "Templates", value: "100,000+" },
      { label: "Storage", value: "Unlimited" },
      { label: "Team Members", value: "Up to 5" },
      { label: "Brand Kits", value: "Unlimited" },
      { label: "Premium Content", value: "Full Access" },
    ],
    category: "Design Tools"
  },
  {
    name: "Leonardo AI",
    description: "Generate stunning AI artwork and images with advanced models. Perfect for artists, designers, and content creators who want to create unique visuals.",
    price: "Rs 800",
    originalPrice: "Rs 1000",
    duration: "/month",
    image: "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/ansari-tools/products/leonardo-ai.jpg",
    badge: "AI Powered",
    rating: 4.7,
    reviews: 750,
    hasVariants: false,
    features: [
      "AI Image Generation with multiple models",
      "Various Art Styles and filters",
      "High Resolution output (up to 4K)",
      "Commercial License included",
      "Fast Processing speed",
      "Batch generation capabilities",
      "Custom model training",
      "API access for developers"
    ],
    specifications: [
      { label: "Models", value: "50+ AI Models" },
      { label: "Resolution", value: "Up to 4K" },
      { label: "Generation Speed", value: "10-30 seconds" },
      { label: "Monthly Credits", value: "8,500" },
      { label: "License", value: "Commercial" },
    ],
    category: "AI Tools"
  }
  // Add more products here as needed
];

async function migrateProducts() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing products (optional - remove this if you want to keep existing data)
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Insert new products
    const insertedProducts = await Product.insertMany(productsData);
    console.log(`Successfully migrated ${insertedProducts.length} products`);

    // Log product names
    insertedProducts.forEach(product => {
      console.log(`- ${product.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateProducts();
