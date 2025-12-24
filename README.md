# Bubble - Sign Up, Sign In, and Profile Management

A simple web application that allows users to sign up, sign in, and manage their profiles.

## Features

- User registration (Sign Up)
- User authentication (Sign In)
- Password recovery
- Profile setup and management
- Profile picture upload
- User bio editing

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- EJS (templating engine)
- HTML/CSS/JavaScript
- JWT (JSON Web Tokens)
- Bcrypt (password hashing)

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Make sure MongoDB is running on your system
4. Start the server: `node app.js`
5. Open your browser and go to `http://localhost:3001`

## Usage

1. Visit the home page to sign up
2. After signing up, you will be redirected to the profile setup page
3. Complete your profile by adding a profile picture and bio
4. Access your profile page to view and edit your information
5. Use the login page to sign in if you already have an account

## Routes

- `/` - Home page (sign up)
- `/login` - Sign in page
- `/profile` - User profile page
- `/profile-setup` - Profile setup page
- `/logout` - Logout functionality
- `/recovery` - Account recovery
- `/forgot-password` - Forgot password page
- `/reset-password` - Password reset page
- `/find-account` - Find account page

## File Structure

- `app.js` - Main application file
- `models/user.js` - User model
- `views/` - EJS templates
- `public/stylesheet/style.css` - CSS styles
