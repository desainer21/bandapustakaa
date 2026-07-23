import crypto from 'node:crypto';
const json=(status,body)=>({statusCode:status,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const sb=()=>({url:process.env.SUPABASE_URL,headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`}});
export default async req=>{
 if(req.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 try{const {buyerName,buyerEmail,wallet,productIds,proofBase64,proofName}=JSON.parse(req.body||'{}');
  if(!buyerName||!['DANA','OVO','GoPay'].includes(wallet)||!Array.isArray(productIds)||!productIds.length)return json(400,{error:'Data pesanan tidak lengkap.'});
  const {url,headers}=sb(); if(!url||!process.env.SUPABASE_SERVICE_ROLE_KEY)return json(500,{error:'Server belum dikonfigurasi.'});
  const q=encodeURIComponent(`in.(${productIds.map(x=>`"${x}"`).join(',')})`);
  const products=await fetch(`${url}/rest/v1/products?select=id,name,price,file_path,is_active&id=${q}`,{headers}).then(r=>r.json());
  if(!Array.isArray(products)||products.length!==productIds.length||products.some(p=>!p.is_active))return json(400,{error:'Produk tidak tersedia.'});
  const orderId=crypto.randomUUID(),token=crypto.randomUUID(),total=products.reduce((n,p)=>n+p.price,0); let proofPath=null;
  if(proofBase64){const match=proofBase64.match(/^data:([^;]+);base64,(.+)$/);if(!match)return json(400,{error:'Format bukti tidak valid.'});const bytes=Buffer.from(match[2],'base64');if(bytes.length>5*1024*1024)return json(400,{error:'Ukuran bukti maksimal 5 MB.'});proofPath=`${orderId}/${Date.now()}-${(proofName||'bukti').replace(/[^a-z0-9._-]/gi,'_')}`;const upload=await fetch(`${url}/storage/v1/object/payment-proofs/${proofPath}`,{method:'POST',headers:{...headers,'content-type':match[1],'x-upsert':'false'},body:bytes});if(!upload.ok)throw new Error('Gagal menyimpan bukti pembayaran.');}
  const order={id:orderId,buyer_name:buyerName,buyer_email:buyerEmail||null,wallet,total,proof_path:proofPath,access_token:token};
  const created=await fetch(`${url}/rest/v1/orders`,{method:'POST',headers:{...headers,'content-type':'application/json',prefer:'return=representation'},body:JSON.stringify(order)});if(!created.ok)throw new Error('Gagal membuat pesanan.');
  const items=products.map(p=>({order_id:orderId,product_id:p.id,product_name:p.name,unit_price:p.price}));const itemRes=await fetch(`${url}/rest/v1/order_items`,{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(items)});if(!itemRes.ok)throw new Error('Gagal menyimpan item pesanan.');
  const [saved]=await created.json();return json(201,{orderCode:saved.order_code,accessToken:token,status:'pending'});
 }catch(e){console.error(e);return json(500,{error:e.message||'Terjadi kesalahan server.'})}
};
