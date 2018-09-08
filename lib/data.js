/*
* Library used for storing and editing data
*
*/

//Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module (to be exported)
var lib = {};

// Base directory for data folder
lib.baseDir = path.join(__dirname, '/.././.data/');

// Write data to a file
lib.create = function (dir, file, data, callback) {
    //Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data parameter to string
            let stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, function (err) {
                if (!err) {
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });
                } else {
                    callback("Error writing to new file");
                }
            });
        } else {
            callback('Could not create new file, it may already exist');
        }
    })
};

// Read data from file
lib.read = function (dir, file, callback) {
    fs.readFile(lib.baseDir + dir + "/" + file + '.json', 'utf-8', function (err, data) {
        if (!err && data) {
            let parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};


// Update data in a file
lib.update = function (dir, file, data, callback) {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data to string
            let stringData = JSON.stringify(data);

            // Truncate the file
            fs.truncate(fileDescriptor, function (err) {
                if (!err) {
                    // Write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, function (err) {
                        if (!err) {
                            fs.close(fileDescriptor, function (err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('error closing existing file')
                                }
                            })
                        } else {
                            callback('error writing to exising file');
                        }
                    })
                } else {
                    callback('error truncating file');
                }
            })
        } else {
            callback('could not open the file for updating, it may not exist yet');
        }
    })
};

// Delete a file
lib.delete = function (dir, file, callback) {
    // Unlink the file
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    })
};

// List all the items in a directory
lib.list = function (dir, callback) {
    fs.readdir(lib.baseDir + dir + '/', function (err, data) {
        if (!err && data && data.length > 0) {
            let trimmedFileNames = [];
            data.forEach(function (fileName) {
                trimmedFileNames.push(fileName.replace('.json', ''));
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    })
}



// Export module
module.exports = lib;