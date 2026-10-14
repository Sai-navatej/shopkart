# 🛒 ShopKart — MERN Stack E-Commerce Application

ShopKart is a full-stack e-commerce web application built using the MERN stack.
It allows users to browse products, manage their shopping cart and wishlist,
complete checkout, and view their orders.

The project demonstrates full-stack web development, REST API integration,
database management, authentication, and payment gateway integration.

---

## 🚀 Features

### 👤 User Authentication
- User registration and login
- JWT-based authentication
- Protected routes for authenticated users

### 🛍️ Product Management
- Browse available products
- View product details
- Display product prices and stock information

### 🛒 Shopping Cart
- Add products to the cart
- Manage product quantities
- View the cart total
- Persist cart data through the backend

### ❤️ Wishlist
- Add products to the wishlist
- View saved products
- Remove products from the wishlist

### 💳 Checkout and Payments
- Enter shipping details
- Validate product availability and prices on the backend
- Integrate Razorpay for test payments
- Verify payment signatures on the server
- Create orders after successful payment verification

### 📦 Order Management
- View order history
- View individual order details
- Track payment and order statuses

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- React Router
- Axios
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Razorpay Payment Gateway

---

## 📁 Project Structure

ShopKart/
├── backend/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── index.js
│
├── shopkart-client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md

---

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB Atlas account or a compatible MongoDB instance
- Git

A Razorpay account is needed to test the payment integration.

### 1. Clone the Repository

```bash
git clone https://github.com/Sai-navatej/shopkart.git
cd shopkart
