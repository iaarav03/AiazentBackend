import express from 'express';
import cloudinary from '../config/cloudinary.js';
import Agent from '../models/Agent.js';
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const agents = await Agent.find();  // Fetch all agents
    res.status(200).json(agents);  // Send the agents in the response
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ message: 'Failed to fetch agents', error: error.message });
  }
});
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    // If there's no query, return an empty response
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // List of stop words to exclude from search
    const stopWords = [
     // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'this', 'that', 'these', 'those',

  // Auxiliary verbs and common conjunctions
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 
  'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',

  // Common question words and adverbs
  'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'here', 'there', 'when', 'where', 'why', 'how', 
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 
  'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',

  // Negations and modal verbs
  'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'mightn', 'mustn', 'needn', 'shan', 
  'shouldn', 'wasn', 'weren', 'won', 'wouldn', 'ain', 'ma',

      'agent','agents','service','system', 'application', 'platform', 'feature', 'technology', 'solution',
      'function','resources','company','companies','product','products','software','app','apps','tool','tools',
      'thing','generate','recommendations','recommendation','find','search','searching','searched','searches'
    ];

    // Split the query into words, filter out stop words
    const filteredQuery = query
      .split(' ')
      .filter(word => !stopWords.includes(word.toLowerCase()))
      .join(' ');

    // If the query becomes empty after filtering, return an error
    if (!filteredQuery) {
      return res.status(400).json({ message: 'Search query is too generic or contains only stop words' });
    }

    // Perform the search with the filtered query
    const agents = await Agent.find(
      { $text: { $search: filteredQuery } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    res.status(200).json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ message: 'Failed to fetch agents', error: error.message });
  }
});




router.post('/create', async (req, res) => {
  try {
    console.log('Request body:', req.body);  // Log the request body
    console.log('Files received:', req.files);
    const { name, createdBy, websiteUrl, accessModel, pricingModel, category, industry, price } = req.body;
    
    // // Check for required fields
    // if (!name || !websiteUrl || !accessModel || !pricingModel || !category || !industry || !price) {
    //   return res.status(400).json({ message: 'Missing required fields' });
    // }

    // Handle logo upload
    let logoUrl = null;
    if (req.files && req.files.logo) {
      const logo = await cloudinary.uploader.upload(req.files.logo.tempFilePath, {
        folder: 'agents',
      });
      logoUrl = logo.secure_url;
    }

    // Handle thumbnail upload
    let thumbnailUrl = null;
    if (req.files && req.files.thumbnail) {
      const thumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, {
        folder: 'agents',
      });
      thumbnailUrl = thumbnail.secure_url;
    }

    // Handle gallery uploads (multiple images)
    let galleryUrls = [];
    if (req.files && req.files.gallery) {
      const galleryFiles = Array.isArray(req.files.gallery) ? req.files.gallery : [req.files.gallery];
      for (const file of galleryFiles) {
        const galleryImage = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'agents/gallery',
        });
        galleryUrls.push(galleryImage.secure_url);
      }
    }

    // Now you have all the file URLs (logoUrl, thumbnailUrl, galleryUrls)
    const agent = new Agent({
      name,
      createdBy,
      websiteUrl,
      accessModel,
      pricingModel,
      category,
      industry,
      price,
      logo: logoUrl,
      thumbnail: thumbnailUrl,
      gallery: galleryUrls,
    });

    // Save the agent to the database
    await agent.save();

    res.status(201).json({ message: 'Agent created successfully', agent });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ message: 'Failed to create agent', error: error.message });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const agentId = req.params.id;
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agent details', error });
  }
});
router.put('/:id/like', async (req, res) => {
  try {
    const agentId = req.params.id;
    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Increment the like count
    agent.likes = (agent.likes || 0) + 1;

    // Save the updated agent
    await agent.save();

    res.json({ updatedLikes: agent.likes });
  } catch (error) {
    res.status(500).json({ message: 'Error updating likes', error });
  }
});
// Define a dedicated search route
// router.get('/search', async (req, res) => {
//   console.log('Search route hit');
//   const { query } = req.query;
//   console.log('Search query:', query);

//   try {
    
//     res.status(200).json({ message: 'Search route hit' });
//   } catch (error) {
//     console.log('Error:', error);
//     res.status(500).json({
//       message: 'Error fetching agents',
//       error: error.message
//     });
//   }
// });




export default router;
