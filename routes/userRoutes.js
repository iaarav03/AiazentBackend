import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Agent from '../models/Agent.js';
import passport from 'passport';
const router = express.Router();

// Function to generate token and set it in cookies
const generateToken = (user, res, statusCode, message) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const cookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production', // Ensure cookies are secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Adjust SameSite based on environment
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    message,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    token,
  });
};

// SIGNUP Route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
    });

    // Save the new user to the database
    const savedUser = await newUser.save();

    // Generate token and set it in cookies
    generateToken(savedUser, res, 201, 'User registered successfully');
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ message: 'Error signing up user', error });
  }
});

// LOGIN Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token and set it in cookies
    generateToken(user, res, 200, 'Login successful');
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Error logging in user', error });
  }
});

// Token verification middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log(req.cookies);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.userId = decoded.id; // Attach user ID to request
    next();
  });
};

// Like Agent Route (Protected)
router.put('/:id/like', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const agentId = req.params.id;
    console.log('hye',userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Check if the user has already liked the agent
    if (user.likedAgents.includes(agentId)) {
      return res.status(400).json({ message: 'You have already liked this agent' });
    }

    // Update agent's like count and user's likedAgents
    agent.likes += 1;
    await agent.save();

    user.likedAgents.push(agentId);
    await user.save();

    res.status(200).json({ message: 'Agent liked successfully', likes: agent.likes });
  } catch (error) {
    console.error('Error liking agent:', error);
    res.status(500).json({ message: 'Error liking agent', error });
  }
});

// LOGOUT Route
router.post('/logout', (req, res) => {
  res.clearCookie('token', { sameSite: 'None', secure: process.env.NODE_ENV === 'production' });
  res.status(200).json({ message: 'Logout successful' });
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token

    console.log(req.user);
    const userid=req.user._id;
    const token=jwt.sign({id:userid},process.env.JWT_SECRET,{expiresIn:'7d'});
    
    // Send token as a cookie
    res.cookie('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production', // Ensure cookies are secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Adjust SameSite based on environment
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    });

    // Redirect to the desired URL after successful login
    res.redirect('http://localhost:1234/');
  }
);

// Get current user route
router.get('/current_user', (req, res) => {
  res.send(req.user);
});

export default router;
