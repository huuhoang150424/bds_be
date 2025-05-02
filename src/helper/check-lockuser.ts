import { Op } from 'sequelize';
import { User } from '@models';
import cron from 'node-cron';

const autoUnlockUsers = async () => {
  try {
    const now = new Date();
    const usersToUnlock = await User.findAll({
      where: {
        isLock: true,
        unlockAt: { [Op.lte]: now },
        isPermanentlyLocked: false
      }
    });
    
    for (const user of usersToUnlock) {
      user.isLock = false;
      user.lockedAt = null;
      user.unlockAt = null;
      await user.save();
      console.log(`✅ Automatically unlocked user ${user.id}`);
    }
  } catch (error) {
    console.error('❌ Error in autoUnlockUsers cron job:', error);
  }
};

export const initUserLockCron = () => {
  cron.schedule('* * * * *', autoUnlockUsers);
  console.log('🔄 User lock cron job initialized');
};

export const checkAndUnlockUsersOnStartup = async () => {
  try {
    await autoUnlockUsers();
    console.log('🔄 Checked and unlocked users on startup');
  } catch (error) {
    console.error('❌ Error checking user locks on startup:', error);
  }
};