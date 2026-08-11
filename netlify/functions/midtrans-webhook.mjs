import crypto from 'node:crypto';
import {sendPush} from './_push.mjs';

const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const validSignature=(data,key)=>crypto.createHash('sha512').update(`${data.order_id}${data.status_code}${data.gross_amount}${key}`).digest('hex')===data.signature_key;

export default async req=>{
 if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
 try{
  const data=await req.json(),url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,midtransKey=process.env.MIDTRANS_SERVER_KEY;
  if(!url||!key||!midtransKey)return reply(500,{error:'Server belum dikonfigurasi.'});
  if(!validSignature(data,midtransKey))return reply(403,{error:'Signature Midtrans tidak valid.'});
  const headers={apikey:key,authorization:`Bearer ${key}`};
  const orders=await fetch(`${url}/rest/v1/orders?select=id,access_token,status&order_code=eq.${encodeURIComponent(data.order_id)}`,{headers}).then(response=>response.json());
  const order=orders?.[0];if(!order)return reply(404,{error:'Pesanan tidak ditemukan.'});
  const paid=(data.transaction_status==='settlement'||(data.transaction_status==='capture'&&data.fraud_status==='accept'));
  const update={payment_status:data.transaction_status,payment_payload:data};
  if(paid){update.status='paid';update.paid_at=new Date().toISOString();}
  const saved=await fetch(`${url}/rest/v1/orders?id=eq.${order.id}`,{method:'PATCH',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(update)});
  if(!saved.ok)throw new Error('Gagal memperbarui pesanan.');
  if(paid&&order.status!=='paid')void sendPush({recipientType:'buyer',orderId:order.id,title:'Pembayaran berhasil',body:'Pembayaran Midtrans diterima. Produk Anda siap diunduh.',url:`/#pesanan=${order.access_token}`}).catch(error=>console.error('Buyer push error:',error.message));
  return reply(200,{received:true});
 }catch(error){console.error(error);return reply(500,{error:'Webhook tidak dapat diproses.'});}
};