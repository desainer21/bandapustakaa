const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const config=()=>({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
async function verifyAdmin(req,url,key){
 const authorization=req.headers.get('authorization'); if(!authorization)throw new Error('Sesi admin diperlukan.');
 const response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,authorization}});
 if(!response.ok)throw new Error('Sesi admin tidak valid.');
 const user=await response.json(); if(user.app_metadata?.role!=='admin')throw new Error('Akses admin ditolak.');
}
export default async req=>{
 if(req.method!=='POST')return json(405,{error:'Method not allowed'});
 try{
  const {recipientType,subscription,orderToken}=await req.json();
  if(!['admin','buyer'].includes(recipientType)||!subscription?.endpoint)return json(400,{error:'Data notifikasi tidak valid.'});
  const {url,key}=config(); if(!url||!key)return json(500,{error:'Server belum dikonfigurasi.'});
  let orderId=null;
  if(recipientType==='admin')await verifyAdmin(req,url,key);
  else{
   if(!orderToken)return json(400,{error:'Token pesanan diperlukan.'});
   const rows=await fetch(`${url}/rest/v1/orders?select=id&access_token=eq.${encodeURIComponent(orderToken)}`,{headers:{apikey:key,authorization:`Bearer ${key}`}}).then(r=>r.json());
   if(!rows?.[0])return json(404,{error:'Pesanan tidak ditemukan.'});
   orderId=rows[0].id;
  }
  const row={endpoint:subscription.endpoint,subscription,recipient_type:recipientType,order_id:orderId,updated_at:new Date().toISOString()};
  const response=await fetch(`${url}/rest/v1/push_subscriptions?on_conflict=endpoint`,{method:'POST',headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json',prefer:'resolution=merge-duplicates'},body:JSON.stringify(row)});
  if(!response.ok)throw new Error('Gagal menyimpan izin notifikasi.');
  return json(201,{saved:true});
 }catch(error){console.error(error);return json(500,{error:error.message||'Gagal mengaktifkan notifikasi.'});}
};