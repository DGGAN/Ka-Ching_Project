// Import the User model and security tools
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. User Registration Function
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Encrypt the password using bcrypt (Hashing) - complies with NFR4 security specs
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new User({
            username,
            email,
            passwordHash,
            oauthProvider: 'NONE' // Default for standard registration
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            message: 'User registered successfully.',
            user: { id: savedUser._id, username: savedUser.username, email: savedUser.email }
        });

    } catch (error) {
        res.status(500).json({ message: 'Registration failed.', error: error.message });
    }
};

// 2. User Login Function
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the email in the database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Verify if the password is correct
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Password is correct, generate JSON Web Token (JWT) - complies with architecture specs
        const token = jwt.sign(
            { id: user._id }, // Put the real userId into the token
            process.env.JWT_SECRET,
            { expiresIn: '30d' } // Token valid for 30 days / Token valid for 30 days
        );

        res.status(200).json({
            message: 'Login successful.',
            token, // The digital token returned to the frontend
            user: { id: user._id, username: user.username, email: user.email }
        });

    } catch (error) {
        res.status(500).json({ message: 'Login failed.', error: error.message });
    }
};