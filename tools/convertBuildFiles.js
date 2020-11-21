// import modules
const path = require("path");
const fs = require("fs");

/**
 * @description Find all files in a folder that follow a given filter rule and
 * execute a method on them.
 * @param {String} startPath - The folder in which we search for files.
 * @param {RegExp} filter - A regular expression used to check file name.
 * @param {Function} callback - The function to execute on the file.
 */
function executeOnFiles(startPath, filter, callback) {
    // check if directory exists
    if (!fs.existsSync(startPath)) {
        throw new Error(`startPath folder does not exist: ${startPath}`);
    }

    // get all file names and iterate through
    let files = fs.readdirSync(startPath);
    for (let file of files) {
        let filename = path.join(startPath, file);
        let stat = fs.lstatSync(filename);

        // check if file is a directory
        if (stat.isDirectory()) {
            // recursive check if it contains files
            executeOnFiles(filename, filter, callback);
        }
        // if file name matches the filter - execute callback
        else if (file.match(filter)) { callback(filename); }
    }
};

// set the build folder
const buildFolder = path.resolve(__dirname, "..", "build");

// change the .ts extensions to .js extensions in content
executeOnFiles(buildFolder, /\.js$/g, (filename) => {
    // get the file content, replace the extensions and rewrite the file
    const file = fs.readFileSync(filename, "utf8");
    const content = file.replace(/\.ts/g, ".js");
    fs.writeFileSync(filename, content, "utf8");
});
