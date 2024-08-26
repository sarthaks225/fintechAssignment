const { RedisApiResponseManager } = require("../connection/redis/index");
const { writeTaskLog } = require("./writeTaskLog");
var activeQueues = new Set(); // Track active queues

const processTask = async (id) => {
  try {
    let isValidToProcessNow = await checkValidity(id, false); // Wait for validity check

    if (isValidToProcessNow) {
      // perform users task
      await taskPerformed(id, false);
    } else {
      if (!activeQueues.has(`queueName_${id}`)) {
        // activating queue on these server only once
        activeQueues.add(`queueName_${id}`);
        setUpQueue(`queueName_${id}`, id);
      }
    }
  } catch (error) {
    console.error("Error in processTask:", error);
  }
};

const checkValidity = async (id, isProcessedFromQueue) => {
  const addToQueue = async (task) => {
    await RedisApiResponseManager.addToQueue(`queueName_${id}`, task);
  };

  try {
    console.log("Checking validity...");

    if (isProcessedFromQueue === false && activeQueues.has(`queueName_${id}`)) {
      let isEmpty = await RedisApiResponseManager.isQueueEmpty(
        `queueName_${id}`
      );
      if (isEmpty === false) {
        // queue is not empty right now so proccess will start from
        //top of queue and adding current task to queue
        addToQueue(id);
        return false;
      }
    }
    let secValue = await RedisApiResponseManager.getKeyData(`sec_${id}`);
    let minValue = await RedisApiResponseManager.getKeyData(`min_${id}`);

    if (secValue || minValue === 20) {
      // code to add task to queue, can not process now
      console.log(`sec Value: ${secValue} , minValue : ${minValue} `);
      addToQueue(id);
      return false;
    } else {
      // can process task
      await doneProcessing(id);
      return true;
    }
  } catch (error) {
    console.error("Error checking validity:", error);
    return false;
  }
};

const doneProcessing = async (id) => {
  await RedisApiResponseManager.setKeyData(`sec_${id}`, "1", 1);

  let minValue = await RedisApiResponseManager.getKeyData(`min_${id}`);

  if (!minValue) {
    await RedisApiResponseManager.setKeyData(`min_${id}`, 1, 60);
  } else {
    await RedisApiResponseManager.incrementKey(`min_${id}`);
    await RedisApiResponseManager.checkAndSetExpiry(`min_${id}`, 60);
  }
};

const taskPerformed = async (id, isProcessedFromQueue) => {
  try {
    const logMessage = `${id}-task completed at-${new Date().toISOString()}\n`;
    await writeTaskLog(logMessage);
  } catch (error) {
    console.error("Error writing to log file:", error);
  }
  if (isProcessedFromQueue) {
    console.log("task proccessed from queue side for id  : ", id);
    return;
  }

  console.log(`task is processed by : ${id}`);
};

async function processQueue(queueName, id) {
  try {
    while (true) {
      let secValue = await RedisApiResponseManager.getKeyData(`sec_${id}`);
      let minValue = await RedisApiResponseManager.getKeyData(`min_${id}`);

      if (secValue || minValue === 20) {
        if (secValue) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        } else {
          //when  minValue is equal to 20
          let ttlMin = await RedisApiResponseManager.getKeyTTL(`min_${id}`);
          console.log(ttlMin, " *********");
          await new Promise((resolve) => setTimeout(resolve, ttlMin * 1000));
          continue;
        }
      }

      let task = await RedisApiResponseManager.getTask(queueName);

      if (task) {
        let isValidToProcessNow = await checkValidity(id, true);

        try {
          if (isValidToProcessNow) {
            // perform users task
            await taskPerformed(task, true);
          } else {
            if (!activeQueues.has(queueName)) {
              // activating queue on these server only once
              console.log("here never ever come $$$$$$$$$$$$$$$$$.....");
              activeQueues.add(queueName);
              setUpQueue(queueName);
            }
          }
        } catch (error) {
          console.error("Error in processTask:", error);
        }
      } else {
        // Sleep for a bit before checking again (e.g., 1 second)
        // activeQueues.delete(queueName);
        // break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error("Error processing queue:", error);
  }
}

const setUpQueue = async (queueName, id) => {
  try {
    await processQueue(queueName, id);
  } catch (error) {
    console.error("Failed to process queue:", error);
  } finally {
    activeQueues.delete(queueName);
  }
};

module.exports = { processTask };
