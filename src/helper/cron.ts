import { checkAndUnlockUsersOnStartup, initUserLockCron } from "./check-lockuser";
import { checkAndUpdatePostsOnStartup, initPostResetCron } from "./reset-posts";


export const initAllCronJobs = () => {
  initUserLockCron();
  initPostResetCron();
  console.log('🔄 All cron jobs initialized');
};

export const runStartupTasks = async () => {
  await checkAndUnlockUsersOnStartup();
  await checkAndUpdatePostsOnStartup();
  console.log('🔄 All startup tasks completed');
};

export const cronExports = {
  initUserLockCron,
  checkAndUnlockUsersOnStartup,
  initPostResetCron,
  checkAndUpdatePostsOnStartup
};