const multer = require('multer');
const path = require('path');

// Storage engine that directs files to different folders based on fieldname
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest;
    if (file.fieldname === 'photo') {
      // Resolve path to be absolute, going up from /middleware to /server/uploads
      dest = path.resolve(__dirname, '..', 'uploads');
    } else if (file.fieldname === 'itemFile') {
      // Resolve path to be absolute, going up from /middleware to /server/private_uploads
      dest = path.resolve(__dirname, '..', 'private_uploads');
    } else {
      return cb(new Error('Invalid field name for file upload'), null);
    }
    cb(null, dest);
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize upload for multiple fields
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    let filetypes;
    // Set allowed filetypes based on the fieldname
    if (file.fieldname === 'photo') {
      filetypes = /jpeg|jpg|png/;
    } else if (file.fieldname === 'itemFile') {
      filetypes = /jpeg|jpg|png|pdf/;
    } else {
      return cb(new Error('Invalid field name for file upload'));
    }

    // Check file extension and mimetype
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      let errorMsg = 'Invalid file type.';
      if (file.fieldname === 'photo') {
        errorMsg = 'Error: Images Only (jpeg, jpg, png)!';
      } else {
        errorMsg = 'Error: Images or PDFs Only!';
      }
      cb(errorMsg);
    }
  }
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'itemFile', maxCount: 1 }
]);

module.exports = upload;
