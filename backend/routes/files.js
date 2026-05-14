const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

// Store files in memory so we can upload them to GridFS
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per file
});

let gfs;
mongoose.connection.once('open', () => {
    // Initialize GridFSBucket
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
});

// Upload file to GridFS
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!gfs) {
        return res.status(500).json({ message: 'GridFS not initialized yet' });
    }

    // Stream the file from memory into GridFS
    const writeStream = gfs.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
    });

    writeStream.end(req.file.buffer);

    writeStream.on('finish', () => {
        // Return the API URL to access this file
        res.status(201).json({ 
            fileId: writeStream.id,
            url: `/api/files/${writeStream.id}`
        });
    });

    writeStream.on('error', (err) => {
        console.error('GridFS Upload Error:', err);
        res.status(500).json({ message: 'Error uploading file' });
    });
});

// Get file from GridFS by ID
router.get('/:id', async (req, res) => {
    try {
        if (!gfs) {
            return res.status(500).json({ message: 'GridFS not initialized yet' });
        }

        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const files = await gfs.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Set the content type so browsers display images correctly
        res.set('Content-Type', files[0].contentType);

        // Stream the file to the client
        const readStream = gfs.openDownloadStream(fileId);
        readStream.pipe(res);

    } catch (error) {
        console.error('GridFS Retrieval Error:', error);
        res.status(500).json({ message: 'Invalid file ID or server error' });
    }
});

module.exports = router;
