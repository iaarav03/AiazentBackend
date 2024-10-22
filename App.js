import express from 'express';
import connectDB from './Config/db.js';
import cookieParser from 'cookie-parser';
import agentRoutes from './routes/agentRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js'
import fileUpload from 'express-fileupload';
import session from 'express-session'; // Import express-session
import passport from 'passport';
import './config/passport.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Load environment variables
dotenv.config();



// Connect to MongoDB
connectDB();

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:1234','http://localhost:63647'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  credentials: true, // Ensure credentials like cookies are allowed
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',  // Temporary folder for file uploads
  })
);
app.use(session({
  secret: 'avcscs3',
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
