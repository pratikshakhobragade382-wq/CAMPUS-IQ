const fs = require("fs");
const path = require("path");
const multer = require("multer");

/*
===========================================================
STUDENT PHOTO UPLOAD DIRECTORY
===========================================================
*/

const UPLOAD_DIR = path.join(
  process.cwd(),
  "uploads",
  "students"
);

/*
===========================================================
CREATE DIRECTORY IF IT DOES NOT EXIST
===========================================================
*/

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, {
    recursive: true,
  });
}

/*
===========================================================
MULTER STORAGE
===========================================================
*/

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },

  filename: (_req, file, callback) => {
    const originalExtension = path
      .extname(file.originalname || "")
      .toLowerCase();

    /*
     * Keep the original image extension when available.
     *
     * Example:
     *
     * photo.jpg
     * photo.png
     * photo.webp
     * photo.jpeg
     */

    const extension =
      originalExtension || ".jpg";

    const uniqueName =
      `student-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    callback(null, uniqueName);
  },
});

/*
===========================================================
IMAGE VALIDATION
===========================================================
*/

const fileFilter = (_req, file, callback) => {
  const mimeType = String(
    file.mimetype || ""
  ).toLowerCase();

  /*
   * Browser sends image/* for normal image formats:
   *
   * image/jpeg
   * image/png
   * image/gif
   * image/webp
   * image/bmp
   * image/avif
   * image/tiff
   * etc.
   */

  if (mimeType.startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(
    new Error(
      "Only image files are allowed. Please select an image such as JPG, JPEG, PNG, GIF, WEBP, BMP, AVIF or another supported image format."
    ),
    false
  );
};

/*
===========================================================
MULTER CONFIGURATION
===========================================================
*/

const uploadStudentPhoto = multer({
  storage,

  fileFilter,

  limits: {
    /*
     * Maximum 10 MB per student photo.
     */
    fileSize: 10 * 1024 * 1024,
  },
}).single("photo");

/*
===========================================================
UPLOAD STUDENT PHOTO
===========================================================
*/

const uploadPhoto = async (req, res) => {
  uploadStudentPhoto(
    req,
    res,
    async (uploadError) => {
      try {
        /*
        =====================================================
        MULTER ERROR
        =====================================================
        */

        if (uploadError) {
          console.error(
            "Student photo upload error:",
            uploadError
          );

          if (
            uploadError instanceof
            multer.MulterError
          ) {
            if (
              uploadError.code ===
              "LIMIT_FILE_SIZE"
            ) {
              return res.status(400).json({
                success: false,
                error:
                  "Photo must be smaller than 10 MB.",
              });
            }

            return res.status(400).json({
              success: false,
              error:
                uploadError.message ||
                "Unable to upload student photo.",
            });
          }

          return res.status(400).json({
            success: false,
            error:
              uploadError.message ||
              "Only image files can be uploaded.",
          });
        }

        /*
        =====================================================
        NO FILE
        =====================================================
        */

        if (!req.file) {
          return res.status(400).json({
            success: false,
            error:
              "Please select an image to upload.",
          });
        }

        /*
        =====================================================
        SERVER PHOTO URL
        =====================================================

        IMPORTANT:

        We return a normal server path.

        We DO NOT return:
        blob:http://...
        data:image/...
        C:\Users\...
        https://...

        The database will store:

        /uploads/students/student-xxxxx.jpg
        */

        const photoUrl =
          `/uploads/students/${req.file.filename}`;

        /*
        =====================================================
        RESPONSE
        =====================================================
        */

        return res.status(201).json({
          success: true,

          message:
            "Student photo uploaded successfully.",

          data: {
            photoUrl,

            filename:
              req.file.filename,

            originalName:
              req.file.originalname,

            mimeType:
              req.file.mimetype,

            size:
              req.file.size,
          },
        });
      } catch (error) {
        console.error(
          "Unexpected student photo upload error:",
          error
        );

        /*
        If something failed after multer saved the file,
        remove the uploaded file so we do not leave
        unnecessary files on the server.
        */

        if (req.file?.path) {
          try {
            if (
              fs.existsSync(
                req.file.path
              )
            ) {
              fs.unlinkSync(
                req.file.path
              );
            }
          } catch (cleanupError) {
            console.error(
              "Failed to remove uploaded photo:",
              cleanupError
            );
          }
        }

        return res.status(500).json({
          success: false,
          error:
            "Unable to upload student photo.",
        });
      }
    }
  );
};

/*
===========================================================
EXPORT
===========================================================
*/

module.exports = {
  uploadPhoto,
};