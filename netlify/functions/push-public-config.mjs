const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export default async req=>{
 if(req.method!=='GET')return json(405,{error:'Method not allowed'});
 if(!process.env.VAPID_PUBLIC_KEY)return json(503,{error:'Notifikasi belum dikonfigurasi.'});
 return json(200,{publicKey:process.env.VAPID_PUBLIC_KEY});
};