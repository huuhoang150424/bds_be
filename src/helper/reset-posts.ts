import { UserPricing } from '@models';
import cron from 'node-cron';


export const resetMonthlyPostFree = async () => {
  try {
    await UserPricing.update(
      { remainingPosts: 15 },
      { where: {} }
    );
    console.log('✅ Reset monthly free posts for all users');
  } catch (err) {
    console.error('❌ Error resetting monthly posts:', err);
  }
};


export const initPostResetCron = () => {
  cron.schedule('0 0 1 * *', resetMonthlyPostFree);
  console.log('🔄 Monthly post reset cron job initialized');
};

export const checkAndUpdatePostsOnStartup = async () => {
  const now = new Date();
  if (now.getDate() === 1) {
    console.log('🔄 Server started on 1st of month, resetting posts...');
    await resetMonthlyPostFree();
  }
};