const response=(status,body,headers={})=>new Response(body,{status,headers});
export default async req=>{
 try{const token=new URL(req.url).searchParams.get('token');if(!token)return response(400,'Token diperlukan.');const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;const headers={apikey:key,authorization:`Bearer ${key}`};
 const order=await fetch(`${url}/rest/v1/orders?select=id,status,order_items(product_id,products(file_path))&access_token=eq.${encodeURIComponent(token)}`,{headers}).then(r=>r.json());
 if(!order?.[0]||order[0].status!=='paid')return response(403,'Pembayaran belum dikonfirmasi.');
 const files=order[0].order_items.map(i=>i.products?.file_path).filter(Boolean);if(!files.length)return response(404,'Berkas pesanan tidak ditemukan.');
 const signed=await Promise.all(files.map(path=>fetch(`${url}/storage/v1/object/sign/digital-files/${path}`,{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({expiresIn:600})}).then(r=>r.json())));
 return response(200,JSON.stringify({downloads:signed.map(x=>`${url}/storage/v1${x.signedURL}`)}),{'content-type':'application/json','cache-control':'no-store'});
 }catch(e){console.error(e);return response(500,'Gagal membuat tautan unduhan.');}
};
