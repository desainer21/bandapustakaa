import webpush from 'web-push';

const config=()=>({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
function configured(){
 const {VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_SUBJECT}=process.env;
 if(!VAPID_PUBLIC_KEY||!VAPID_PRIVATE_KEY||!VAPID_SUBJECT)return false;
 webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY);
 return true;
}

export async function sendPush({recipientType,orderId,title,body,url}){
 if(!configured())return {sent:0,skipped:true};
 const {url:baseUrl,key}=config(); if(!baseUrl||!key)return {sent:0,skipped:true};
 const params=new URLSearchParams({select:'id,subscription',recipient_type:`eq.${recipientType}`});
 if(orderId)params.set('order_id',`eq.${orderId}`);
 const headers={apikey:key,authorization:`Bearer ${key}`};
 const response=await fetch(`${baseUrl}/rest/v1/push_subscriptions?${params}`,{headers});
 if(!response.ok)throw new Error('Gagal memuat subscription notifikasi.');
 const subscriptions=await response.json();
 const payload=JSON.stringify({title,body,url}); let sent=0;
 await Promise.all(subscriptions.map(async item=>{
  try{await webpush.sendNotification(item.subscription,payload);sent++;}
  catch(error){
   if(error.statusCode===404||error.statusCode===410)await fetch(`${baseUrl}/rest/v1/push_subscriptions?id=eq.${item.id}`,{method:'DELETE',headers});
   else console.error('Push delivery failed:',error.statusCode||error.message);
  }
 }));
 return {sent};
}