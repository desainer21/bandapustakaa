const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

export default async req=>{
 if(req.method!=='POST')return json(405,{error:'Method not allowed'});
 try{
  const {email,password}=await req.json();
  if(!email||!password)return json(400,{error:'Email dan password wajib diisi.'});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return json(500,{error:'Server belum dikonfigurasi.'});
  const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify({email,password})});
  const data=await response.json();
  if(!response.ok)return json(401,{error:'Email atau password tidak sesuai.'});
  if(data.user?.app_metadata?.role!=='admin')return json(403,{error:'Akun ini bukan admin.'});
  return json(200,{accessToken:data.access_token});
 }catch(error){console.error(error);return json(500,{error:'Login belum dapat diproses. Coba lagi.'});}
};