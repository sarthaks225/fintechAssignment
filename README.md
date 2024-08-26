# fintechAssignment

The task has a rate limit of 1 task per second and 20 tasks per minute for each user ID. Users will hit the route to process tasks multiple times. You need to implement a queueing system to ensure that tasks are processed according to the rate limit for each user ID.

## Instructions

1. **Initialize npm after cloning the repository:**

   Run the following command to initialize npm in the project directory:

   ```
   npm init -y
   ```

2. **Install the required package for Redis:**

   Install the Redis client package using npm

   ```
   npm install redis
   ```

3. **Create a .env file:**

   In the root directory of the project, create a .env file and add the following content:

   ```
   redisHost=redisIp
   redisPort=redisPort
   redisPassword=redisPassword
   ```

4. **Start the Server:**

   To start the server, run:

   ```
   npm start
   ```

5. **Making a Request:**

   Use the following curl command to make a POST request to process a task:

   ```
   curl "http://localhost:3000/api/v1/task" \
   -X POST \
   -d "{\"user_id\" : 104}" \
   -H "Content-Type: application/json"

   ```

6. **Project Structure**

   - `connection/:` Contains connection-related files for Redis.

   - `index.js:` Main entry point of the application.

   - `logs/:` Folder to store log files (will be ignored by Git, but folder will be present in the repo).
   - `modules/:` Contains module files for task processing and queueing.
