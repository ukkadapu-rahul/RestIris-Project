class EyeStrainTimer {
  constructor() {
    this.workDuration = 20 * 60; // 20 minutes
    this.breakDuration = 20; // 20 seconds
    this.currentTime = this.workDuration;
    this.isRunning = false;
    this.isBreakTime = false;
    this.interval = null;
    this.endless = true;
    this.cycleCompleted = false;

    this.initializeElements();
    this.bindEvents();
    this.updateDisplay();
  }

  initializeElements() {
    this.startBtn = document.getElementById('start-btn');
    this.stopBtn = document.getElementById('stop-btn');
    this.timerText = document.getElementById('timer-text');
    this.timerLabel = document.getElementById('timer-label');
    this.statusText = document.getElementById('status-text');
    this.breakMessage = document.getElementById('break-message');
    this.breakTimer = document.getElementById('break-timer');
    this.minimizeBtn = document.getElementById('minimize-btn');
    this.closeBtn = document.getElementById('close-btn');
    this.endlessCheckbox = document.getElementById('endless-checkbox');
  }

  bindEvents() {
    this.startBtn.addEventListener('click', () => this.startTimer());
    this.stopBtn.addEventListener('click', () => this.stopTimer());
    this.minimizeBtn.addEventListener('click', () => window.electronAPI.minimizeWindow());
    this.closeBtn.addEventListener('click', () => window.electronAPI.closeWindow());
    if (this.endlessCheckbox) {
      this.endlessCheckbox.addEventListener('change', (e) => {
        this.endless = e.target.checked;
      });
      this.endless = this.endlessCheckbox.checked;
    }
  }

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startBtn.disabled = true;
    this.stopBtn.disabled = false;
    this.statusText.textContent = 'Timer running...';
    this.cycleCompleted = false;

    this.interval = setInterval(() => {
      this.currentTime--;
      this.updateDisplay();

      if (this.currentTime <= 0) {
        if (!this.isBreakTime) {
          this.handleWorkEnd();
        } else {
          this.completeBreak();
        }
      }
    }, 1000);
  }

  stopTimer() {
    this.isRunning = false;
    clearInterval(this.interval);
    this.interval = null;
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
    this.resetTimer();
    this.statusText.textContent = 'Timer stopped';
    this.cycleCompleted = false;
  }

  handleWorkEnd() {
    clearInterval(this.interval);
    this.interval = null;
    window.electronAPI.showNotification(
      'Break Time!',
      'Look at something 20 feet away for 20 seconds'
    );
    window.electronAPI.restoreWindow();
    this.statusText.textContent = 'Break starting soon...';
    setTimeout(() => {
      this.startBreak();
    }, 1000); // Wait 1 second before starting break
  }

  startBreak() {
    this.isBreakTime = true;
    this.currentTime = this.breakDuration;
    this.breakMessage.classList.remove('hidden');
    this.statusText.textContent = 'Break time! Get ready...';
    
    // Wait 2 seconds before starting the countdown
    setTimeout(() => {
      this.statusText.textContent = 'Break time!';
      this.interval = setInterval(() => {
        this.currentTime--;
        this.updateDisplay();

        if (this.currentTime <= 0) {
          this.completeBreak();
        }
      }, 1000);
    }, 2000); // Wait 2 seconds before starting countdown
  }

  completeBreak() {
    clearInterval(this.interval);
    this.interval = null;
    this.isBreakTime = false;
    this.breakMessage.classList.add('hidden');
    window.electronAPI.showNotification("Break's done!", "Your break is over. Time to get back to work!");
    if (this.endless) {
      this.resetTimer();
      this.startTimer();
      this.statusText.textContent = 'Back to work! Timer running...';
      window.electronAPI.minimizeWindow();
    } else {
      this.resetTimer();
      this.statusText.textContent = 'Cycle complete! Press Start to run again.';
      this.startBtn.disabled = false;
      this.stopBtn.disabled = true;
      this.cycleCompleted = true;
    }
  }

  resetTimer() {
    this.currentTime = this.workDuration;
    this.isRunning = false;
    this.isBreakTime = false;
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.isBreakTime) {
      this.breakTimer.textContent = this.currentTime;
    } else {
      const minutes = Math.floor(this.currentTime / 60);
      const seconds = this.currentTime % 60;
      this.timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new EyeStrainTimer();
});
