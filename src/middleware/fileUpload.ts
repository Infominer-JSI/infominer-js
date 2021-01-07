/***********************************************
 * File Upload
 * This middleware enables uplading files to
 * the service.
 */

// import modules
import path from "path";
import multer from "multer";

// import utils
import { createDirectory } from "../utils/FileSystem";

// //////////////////////////////////////////////
// Configure upload logic
// //////////////////////////////////////////////

// create the temporary folder
const TMP_UPLOAD_PATH = path.join(__dirname, "..", "..", "tmp", "upload");
createDirectory(TMP_UPLOAD_PATH);

// create the target upload with storage
const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, TMP_UPLOAD_PATH);
        },
    }),
}).single("file");

export default upload;
