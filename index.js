// Import the required modules
const express = require("express");
require("dotenv").config();
const { RedisManager } = require("./connection/redis/index");
const http = require("http");
const { processTask } = require("./modules/processTask");

// Create an instance of Express
const app = express();

// Middleware to parse JSON body and handle JSON parsing errors
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Middleware to handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Bad JSON");
    return res.status(400).send({ error: "Invalid JSON" }); // Return an error response if JSON is invalid
  }
  next();
});

// Define the POST route for adding a task
app.post("/api/v1/task", async (req, res) => {
  try {
    const { user_id } = await req.body; // Extract user_id from the request body

    if (!user_id) {
      // Validate the user_id
      return res.status(400).send("user_id is required");
    }

    await processTask(user_id); // Call processTask with the user_id
    res.status(200).send("response received successfully");
  } catch (error) {
    console.error("Error processing task:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Specify a port to listen on
const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await RedisManager.connect();
});
