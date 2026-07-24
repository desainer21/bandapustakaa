const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const config=()=>({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
async function requireAdmin(req){
 const {url,key}=config();if(!url||!key)throw new Error('Server belum dikonfigurasi.');
 const token=req.headers.get('authorization');if(!token)throw new Error('Sesi admin diperlukan.');
 const r=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,authorization:token}});if(!r.ok)throw new Error('Sesi admin tidak valid.');
 const user=await r.json();if(user.app_metadata?.role!=='admin')throw new Error('Akses admin ditolak.');
 return {url,key};
}
export default async req=>{
 if(req.method!=='POST')return json(405,{error:'Method not allowed'});
 try{
const {action,orderId}=await req.json();if(!['list','proof','confirm'].includes(action)||((action==='proof'||action==='confirm')&&!orderId))return json(400,{error:'Permintaan tidak valid.'});
  const {url,key}=await requireAdmin(req);const headers={apikey:key,authorization:`Bearer ${key}`};
  if(action==='list'){
   const rows=await fetch(`${url}/rest/v1/orders?select=id,buyer_name,wallet,status,created_at,proof_path,access_token,order_items(product_name)&order=created_at.desc`,{headers}).then(r=>r.json());
   if(!Array.isArray(rows))throw new Error('Gagal memuat transaksi.');return json(200,{orders:rows});
  }
  const rows=await fetch(`${url}/rest/v1/orders?select=id,proof_path,access_token,status&id=eq.${encodeURIComponent(orderId)}`,{headers}).then(r=>r.json());const order=rows?.[0];if(!order)return json(404,{error:'Pesanan tidak ditemukan.'});
  if(action==='proof'){if(!order.proof_path)return json(404,{error:'Bukti transfer belum diunggah.'});const signed=await fetch(`${url}/storage/v1/object/sign/payment-proofs/${order.proof_path}`,{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({expiresIn:300})}).then(r=>r.json());if(!signed.signedURL)throw new Error('Gagal membuka bukti transfer.');return json(200,{url:`${url}/storage/v1${signed.signedURL}`});}
  if(order.status!=='paid'){const updated=await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,{method:'PATCH',headers:{...headers,'content-type':'application/json',prefer:'return=representation'},body:JSON.stringify({status:'paid',paid_at:new Date().toISOString()})});if(!updated.ok)throw new Error('Gagal mengonfirmasi pembayaran.');}
  return json(200,{downloadPath:`/#pesanan=${order.access_token}`});
 }catch(e){console.error(e);return json(500,{error:e.message||'Terjadi kesalahan server.'});}
};