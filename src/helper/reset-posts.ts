import { UserPricing } from '@models';
import cron from 'node-cron';



const resetMonthlyPost=async ()=>{
  try {
    await UserPricing.update(
      {remainingPosts: 15},
      {where:{}}
    )
  } catch (err) {
    console.log(err)
  }
}

cron.schedule('0 0 1 * *', resetMonthlyPost);

export const checkAndUpdatePostsOnStartup = async () => {
  const now = new Date();
  if (now.getDate() === 1) {
    console.log('🔄 Server restart vào ngày đầu tháng, reset số bài đăng...');
    await resetMonthlyPost();
  }
};