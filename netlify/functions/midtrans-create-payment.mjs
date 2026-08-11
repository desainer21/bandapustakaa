import crypto from 'node:crypto';
import {sendPush} from './_push.mjs';

const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const config=()=>({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,midtransKey:process.env.MIDTRANS_SERVER_KEY,production:process.env.MIDTRANS_IS_PRODUCTION==='true'});
const basic=key=>`Basic ${Buffer.from(`${key}:`).toString('base64')}`;

export default async req=>{
 if(req.method!=='POST')return json(405,{error:'Method not allowed'});
 try{
  const {buyerName,buyerEmail,productIds}=await req.json();
  if(!buyerName||!Array.isArray(productIds)||!productIds.length)return json(400,{error:'Data pesanan tidak lengkap.'});
  const {url,key,midtransKey,production}=config();
  if(!url||!key)return json(500,{error:'Server belum dikonfigurasi.'});
  if(!midtransKey)return json(503,{error:'Pembayaran Midtrans belum dikonfigurasi oleh toko.'});
  const headers={apikey:key,authorization:`Bearer ${key}`};
  const list=encodeURIComponent(`in.(${productIds.map(id=>`"${id}"`).join(',')})`);
  const products=await fetch(`${url}/rest/v1/products?select=id,name,price,file_path,is_active&id=${list}`,{headers}).then(response=>response.json());
  if(!Array.isArray(products)||products.length!==productIds.length||products.some(product=>!product.is_active))return json(400,{error:'Produk tidak tersedia.'});
  const orderId=crypto.randomUUID(),accessToken=crypto.randomUUID(),orderCode=`BP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const total=products.reduce((sum,product)=>sum+product.price,0);
  const order={id:orderId,order_code:orderCode,buyer_name:buyerName,buyer_email:buyerEmail||null,wallet:'MIDTRANS',total,access_token:accessToken,payment_provider:'midtrans',payment_status:'pending'};
  const orderResponse=await fetch(`${url}/rest/v1/orders`,{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(order)});
  if(!orderResponse.ok)throw new Error('Gagal membuat pesanan.');
  const itemResponse=await fetch(`${url}/rest/v1/order_items`,{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(products.map(product=>({order_id:orderId,product_id:product.id,product_name:product.name,unit_price:product.price})))});
  if(!itemResponse.ok)throw new Error('Gagal menyimpan item pesanan.');
  const origin=new URL(req.url).origin;
  const payload={transaction_details:{order_id:orderCode,gross_amount:total},item_details:products.map(product=>({id:product.id,name:product.name.slice(0,50),price:product.price,quantity:1})),customer_details:{first_name:buyerName,...(buyerEmail?{email:buyerEmail}:{})},callbacks:{finish:`${origin}/#pesanan=${accessToken}`,pending:`${origin}/#pesanan=${accessToken}`,error:`${origin}/#pesanan=${accessToken}`}};
  const endpoint=production?'https://app.midtrans.com/snap/v1/transactions':'https://app.sandbox.midtrans.com/snap/v1/transactions';
  const paymentResponse=await fetch(endpoint,{method:'POST',headers:{authorization:basic(midtransKey),'content-type':'application/json','accept':'application/json'},body:JSON.stringify(payload)});
  const payment=await paymentResponse.json();
  if(!paymentResponse.ok||!payment.redirect_url){
   await fetch(`${url}/rest/v1/orders?id=eq.${orderId}`,{method:'DELETE',headers});
   throw new Error(payment.error_messages?.[0]||'Gagal membuat halaman pembayaran Midtrans.');
  }
  void sendPush({recipientType:'admin',title:'Pesanan Midtrans baru',body:`${buyerName} memulai pembayaran ${orderCode}.`,url:'/#admin'}).catch(error=>console.error('Admin push error:',error.message));
  return json(201,{paymentUrl:payment.redirect_url,accessToken,orderCode});
 }catch(error){console.error(error);return json(500,{error:error.message||'Pembayaran belum dapat dibuat.'});}
};