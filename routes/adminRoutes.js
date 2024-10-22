import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Agent from '../models/Agent.js';
const router = express.Router();
const verifyAdmin = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
  
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch the user from the database
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if the user is an admin
      if (!user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
  
      // If everything is good, proceed to the next middleware/route handler
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid token or token verification failed', error: error.message });
    }
  };
  
  router.get('/agents/accepted', verifyAdmin, async (req, res) => {
    try {
      const acceptedAgents = await Agent.find({ status: 'accepted' });
      res.status(200).json(acceptedAgents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch accepted agents', error: error.message });
    }
  });
  router.get('/agents/requested', verifyAdmin, async (req, res) => {
    try {
      const requestedAgents = await Agent.find({ status: 'requested' });
      res.status(200).json(requestedAgents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch requested agents', error: error.message });
    }
  });
  router.put('/agents/:id/status', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // Expecting "accepted" or "rejected"
  
      // Validate status
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Status must be "accepted" or "rejected".' });
      }
  
      const agent = await Agent.findById(id);
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
  
      // Update agent status
      agent.status = status;
      await agent.save();
  
      res.status(200).json({ message: `Agent ${status} successfully`, agent });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update agent status', error: error.message });
    }
  });
  router.delete('/agents/:id', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const agent = await Agent.findByIdAndDelete(id);
  
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
  
      res.status(200).json({ message: 'Agent deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete agent', error: error.message });
    }
  });
  export default router;

