const { RedisClient } = require("./common");

async function setKeyData(apiKey, data, time = 86400) {
  // 86400 seconds = 24 hours
  const key = `${apiKey}`;
  try {
    await RedisClient.set(key, data, "EX", time);
    console.log("Redis key set with expiration");
  } catch (error) {
    console.error("Error setting key in Redis:", error);
  }
}

async function getKeyData(apiKey) {
  const key = `${apiKey}`;
  return new Promise((resolve, reject) => {
    RedisClient.get(key, (err, result) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(result ? JSON.parse(result) : null);
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
}

async function incrementKey(key) {
  try {
    // Increment the value of the key and get the new value
    const newValue = await new Promise((resolve, reject) => {
      RedisClient.incr(key, (err, reply) => {
        if (err) reject(err);
        resolve(reply);
      });
    });

    console.log(`New value after increment: ${newValue}`);
    return newValue;
  } catch (error) {
    console.error("Error incrementing key:", error);
    throw error;
  }
}

async function getKeyTTL(apiKey) {
  const key = `${apiKey}`;
  try {
    // Fetch the TTL of the key
    const ttl = await new Promise((resolve, reject) => {
      RedisClient.ttl(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });

    console.log(`TTL for key "${key}": ${ttl} seconds`);
    return ttl;
  } catch (error) {
    console.error("Error getting TTL for key:", error);
    throw error;
  }
}

async function checkAndSetExpiry(key, expiryTime) {
  try {
    // Check the TTL of the key
    const ttl = await new Promise((resolve, reject) => {
      RedisClient.ttl(key, (err, reply) => {
        if (err) reject(err);
        resolve(reply);
      });
    });
    //console.log("checking for expiry time.... ");
    // If TTL is -1, the key does not have an expiry time set
    if (ttl === -1) {
      // Set the expiry time
      //console.log("setting up expiry time .........****");
      await new Promise((resolve, reject) => {
        RedisClient.expire(key, expiryTime, (err, reply) => {
          if (err) reject(err);
          resolve(reply);
        });
      });
      //console.log(`Expiry time of ${expiryTime} seconds set for key "${key}".`);
    } else if (ttl === -2) {
      console.log(`Key "${key}" does not exist.`);
    } else {
      console.log(`Key "${key}" already has an expiry time of ${ttl} seconds.`);
    }
  } catch (error) {
    console.error("Error checking or setting expiry time:", error);
    throw error;
  }
}

async function addToQueue(queueName, task) {
  try {
    // console.log(
    //   `Queue Name: ${queueName}, Task Type: ${typeof task}, Task: ${task}`
    // );
    await new Promise((resolve, reject) => {
      RedisClient.rPush(queueName, JSON.stringify(task), (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
    console.log("Task added to queue:", task);
  } catch (error) {
    console.error("Error adding task to queue:", error);
  }
}

const getTask = async (queueName) => {
  return new Promise((resolve, reject) => {
    RedisClient.lPop(queueName, (err, reply) => {
      if (err) reject(err);
      resolve(reply ? JSON.parse(reply) : null);
    });
  });
};

async function isQueueEmpty(queueName) {
  try {
    // Fetch the length of the queue
    const queueLength = await new Promise((resolve, reject) => {
      RedisClient.llen(queueName, (err, length) => {
        if (err) {
          reject(err);
        } else {
          resolve(length);
        }
      });
    });

    // Check if the queue is empty
    const isEmpty = queueLength === 0;
    console.log(`Queue "${queueName}" is ${isEmpty ? "empty" : "not empty"}`);
    return isEmpty;
  } catch (error) {
    console.error("Error checking if queue is empty:", error);
    throw error;
  }
}

module.exports = {
  setKeyData,
  getKeyData,
  incrementKey,
  getKeyTTL,
  checkAndSetExpiry,
  addToQueue,
  getTask,
  isQueueEmpty,
};
