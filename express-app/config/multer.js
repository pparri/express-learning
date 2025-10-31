import multer from 'multer';

export const storage = multer.diskStorage({    
    destination: 'uploads',
    //Mantener extensión MIME
    filename: (req, file, cb) => {
        const originalName = file.originalname;
        cb(null, file.fieldname + '-' + Date.now() + originalName);
    }
});