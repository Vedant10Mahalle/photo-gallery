const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/photoGallery', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const mediaSchema = new mongoose.Schema({
  filename: String,
  uploadDate: { type: Date, default: Date.now },
  fileType: String,
});

const Media = mongoose.model('Media', mediaSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// API to upload multiple files
app.post('/upload', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files were uploaded!' });
    }

    // Save file details to the database
    const mediaEntries = req.files.map((file) => ({
      filename: file.filename,
      fileType: path.extname(file.originalname),
    }));

    await Media.insertMany(mediaEntries);

    res.json({ message: 'Files uploaded successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading files.' });
  }
});

// API to fetch files with sorting
app.get('/files', async (req, res) => {
  try {
    const { sort = 'desc' } = req.query; // Default to descending order
    const files = await Media.find().sort({ uploadDate: sort === 'asc' ? 1 : -1 });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching files.' });
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
