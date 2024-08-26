// writeTaskLog.js
const fs = require("fs");
const path = require("path");

// Log file path
const logDirectory = path.join(__dirname, "../logs");
const logFilePath = path.join(logDirectory, "task_log.txt");

// Ensure the directory exists
async function ensureDirectoryExists(directory) {
  return new Promise((resolve, reject) => {
    fs.mkdir(directory, { recursive: true }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Write a message to the log file
async function writeTaskLog(message) {
  try {
    await ensureDirectoryExists(logDirectory);
    await new Promise((resolve, reject) => {
      fs.appendFile(logFilePath, message, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    console.error("Error writing to log file:", error);
  }
}

module.exports = { writeTaskLog };
