const workingTime = 5;
const shortBreakTime = 2;
const longBreakTime = 4;
const pomob4break = 4;
/* Function to count down the current timer
 *
 * @param {int} start time in milliseconds
 * @param {int} duration for this timer in milliseconds
 * @param {int} ID returned by setInterval, used by clearInterval
 * @param {int} the index of the current task in TASKS
 * @param {array} the array containing all the task objects
 */
function countDown(start, duration, timerID, taskIndex, TASKS) {
  // get the timer HTML element
  let element = document.getElementById('timer');
  // calculate the difference between current time
  // and start time in seconds
  let difference = duration - Math.floor((Date.now() - start) / 1000);
  // clearInterval and call sessionFinish once time is up
  if (difference < 0) {
    if (timerID != null) {
      clearInterval(timerID);
    }
    element.innerHTML = '00:00';
    sessionFinish(duration, taskIndex, TASKS);
    return;
  }
  // converts the differnece in seconds to minutes and seconds
  let minutes = Math.floor(difference / 60);
  let seconds = Math.floor(difference % 60);
  // take the absolute value of minutes and seconds for safe measures
  minutes = minutes < 0 ? 0 : minutes;
  seconds = seconds < 0 ? 0 : seconds;
  // formate the minutes and seconds to two digit string
  minutes = minutes.toLocaleString('en-US', {
    minimumIntegerDigits: 2
  });
  seconds = seconds.toLocaleString('en-US', {
    minimumIntegerDigits: 2
  });
  element.innerHTML = minutes + ':' + seconds;
}

/* Function to start a new timer instance
 *
 * @param {int} duration for this timer in milliseconds
 * @param {numWork} number of work sessions done
 * @param {function} callback function to use when timer hits zero
 * @param {array} the array containing all the task objects
 */
function startTimer(duration, taskIndex, TASKS) {
  const start = Date.now();
  // call countDown first for initialization
  countDown(start, duration, null, taskIndex, TASKS);
  // timer ID is used to clear the interval once the timer hits zero
  // call countDown for every 500 milliseconds
  var timerID = setInterval(function () {
    countDown(start, duration, timerID, taskIndex, TASKS);
  }, 500);
}

/* Function to act as a callback when timer hits zero,
 * calculate pomos left and changing the background
 *
 * @param {int} the duration of the timer that hits zero
 * @param {numWork} number of work sessions done
 * @param {array} the array containing all the task objects
 */
function sessionFinish(prevDuration, taskIndex, TASKS) {
  let nextTask = taskIndex;
  let newDuration = 0;
  if (prevDuration === workingTime) {
    TASKS[taskIndex].pomosLeft = parseInt(TASKS[taskIndex].pomosLeft) - 1;
    document.getElementById('pomosleft').innerHTML =
      TASKS[nextTask].pomosLeft + ' pomos to go';
  }

  // if no more working sessions left for current task
  if (TASKS[taskIndex].pomosLeft == 0) {
    // if the user has alreaday had the final break
    if (prevDuration == shortBreakTime || prevDuration == longBreakTime) {
      // move to next task, refresh the task list display as well
      nextTask = taskIndex + 1;
      newDuration = workingTime;
      document.getElementById(
        'showTasks'
      ).innerHTML = `Active : ${TASKS[nextTask].taskName}`;
      refreshTasksList(TASKS);
    } else {
      // if the user just finishes the last working session
      if (
        window.confirm('Would you like to add addtional time for this task?')
      ) {
        // ask the user to input valid addtional time
        let addTime = '';
        do {
          addTime = window.prompt(
            'Please enter addtional SECONDS you need in whole numbers. ***For testing only***'
          );
        } while (
          (addTime != null && isNaN(parseInt(addTime))) ||
          (addTime != null && parseInt(addTime) < 0)
        );

        // go to the final break if no additional time added
        if (addTime == null || parseInt(addTime) == 0) {
          TASKS[taskIndex].done = true;
          nextTask = taskIndex + 1;
          // if the finished task is the final task redirect the user back to landing page
          if (nextTask >= TASKS.length) {
            document.getElementById('pomosleft').innerHTML = '0 pomos to go';
            alert(
              'Congratulations! You have finished all your tasks! Exiting timer.'
            );
            localStorage.setItem('done', '1');
            window.location.href = './../pages/tasks.html';
          }
          // calculate the final break duration
          nextTask -= 1;
          let pomosDone = TASKS[taskIndex].pomos - TASKS[taskIndex].pomosLeft;
          newDuration =
            pomosDone % pomob4break == 0 ? longBreakTime : shortBreakTime;
        } else {
          // add additional time and pomos to the timer
          let addedTime = parseInt(addTime);
          let addPomos = Math.floor(addedTime / workingTime);
          addPomos = addedTime % workingTime > 0 ? addPomos + 1 : addPomos;

          // update min
          TASKS[taskIndex].min = parseInt(TASKS[taskIndex].min) + addedTime;
          // update pomos
          TASKS[taskIndex].pomos = parseInt(TASKS[taskIndex].pomos) + addPomos;
          // update pomos left
          TASKS[taskIndex].pomosLeft = addPomos;

          // calculate whether the next break is a short break or long break
          let pomosDone =
            parseInt(TASKS[taskIndex].pomos) -
            parseInt(TASKS[taskIndex].pomosLeft);
          newDuration =
            pomosDone % pomob4break == 0 ? longBreakTime : shortBreakTime;
        }
      } else {
        // if the user doesn't wish to add more time
        TASKS[taskIndex].done = true;
        nextTask = taskIndex + 1;
        // if the finished task is the final task redirect the user back to landing page
        if (nextTask >= TASKS.length) {
          document.getElementById('pomosleft').innerHTML = '0 pomos to go';
          alert(
            'Congratulations! You have finished all your tasks! Exiting timer.'
          );
          localStorage.setItem('done', '1');
          window.location.href = './../pages/tasks.html';
        }
        nextTask -= 1;
        let pomosDone = TASKS[taskIndex].pomos - TASKS[taskIndex].pomosLeft;
        newDuration =
          pomosDone % pomob4break == 0 ? longBreakTime : shortBreakTime;
      }
    }
  } else {
    // if there are more working sessions left for current task
    if (prevDuration == workingTime) {
      // determine if it's a long break or a short break
      let pomosDone = TASKS[taskIndex].pomos - TASKS[taskIndex].pomosLeft;
      newDuration =
        pomosDone % pomob4break == 0 ? longBreakTime : shortBreakTime;
    } else {
      newDuration = workingTime;
    }
  }

  // update local storage
  localStorage.setItem('tasks', JSON.stringify(TASKS));
  document.getElementById('pomosleft').innerHTML =
    TASKS[nextTask].pomosLeft + ' pomos to go';

  // change the page background based on the next timer session type
  let workTimerBackground = document.getElementsByClassName(
    'workTimerBackground'
  )[0];
  let pageBackground = document.getElementsByTagName('BODY')[0];

  let EndSessionButton = document.getElementById('EndSessionButton');

  if (newDuration == longBreakTime) {
    document.getElementById('timerdescription').innerHTML = 'Long Break';
    //long break timer background
    workTimerBackground.style.backgroundColor = '#adffd1';
    //long break page background
    pageBackground.style.backgroundColor = '#47de88';
    EndSessionButton.style.backgroundColor = '#47de88';
  } else if (newDuration == shortBreakTime) {
    document.getElementById('timerdescription').innerHTML = 'Short Break';
    //short break timer background
    workTimerBackground.style.backgroundColor = '#6ea3ff';
    pageBackground.style.backgroundColor = '#36a1ff';
    EndSessionButton.style.backgroundColor = '#36a1ff';
  } else if (newDuration == workingTime) {
    document.getElementById('timerdescription').innerHTML = 'Work Session';
    //work break timer background
    workTimerBackground.style.backgroundColor = '#ffb5b5';
    pageBackground.style.backgroundColor = '#ff6767';
    EndSessionButton.style.backgroundColor = '#ff6767';
  }

  // start the next session timer
  startTimer(newDuration, nextTask, TASKS);
}

// eslint-disable-next-line no-unused-vars
function displayTasks() {
  let height = document.getElementById('tasks').style.height;
  if (height != '30vh') {
    document.getElementById('tasks').style.height = '30vh';
  } else {
    document.getElementById('tasks').style.height = '0vh';
  }
}

function refreshTasksList(TASKS) {
  document.getElementById('tasks').innerHTML = '';
  TASKS.forEach((task) => {
    if (!task.done) {
      let taskElement = `<li><input type="text" name="task" class="task" value="${task.taskName}"/></li>`;
      document
        .getElementById('tasks')
        .insertAdjacentHTML('beforeend', taskElement);
    }
  });
  TASKS.forEach((task) => {
    if (task.done) {
      let taskElement = `<li><input type="text" name="task" class="task-done" value="${task.taskName}"/></li>`;
      document
        .getElementById('tasks')
        .insertAdjacentHTML('beforeend', taskElement);
    }
  });
}

// eslint-disable-next-line no-unused-vars
function taskPeak() {
  let height = document.getElementById('tasks').style.height;
  if (height == '0vh' || height == '') {
    document.getElementById('tasks').style.height = '2vh';
  }
}

// eslint-disable-next-line no-unused-vars
function taskUnpeak() {
  let height = document.getElementById('tasks').style.height;
  if (height == '2vh') {
    document.getElementById('tasks').style.height = '0vh';
  }
}

// load the tasks and current active task, then start timer
window.onload = () => {
  var TASKS = JSON.parse(localStorage.getItem('tasks'));
  TASKS.forEach((task) => {
    task.pomosLeft = task.pomos;
    task.done = false;
  });
  refreshTasksList(TASKS);
  document.getElementById(
    'showTasks'
  ).innerHTML = `Active : ${TASKS[0].taskName}`;
  document.getElementById('pomosleft').innerHTML =
    TASKS[0].pomosLeft + ' pomos to go';
  document.getElementById('timerdescription').innerHTML = 'Work Session';
  localStorage.setItem('tasks', JSON.stringify(TASKS));
  startTimer(workingTime, 0, TASKS);
};

module.exports = { startTimer, countDown, sessionFinish };
