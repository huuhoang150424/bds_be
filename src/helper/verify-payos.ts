import crypto from 'crypto';

export const verifyPayOSSignature= (data: any, signature: string) =>{
  const secretKey = process.env.PAYOS_SECRET || '';
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(JSON.stringify(data));
  const calculatedSignature = hmac.digest('hex');
  return calculatedSignature === signature;
}
