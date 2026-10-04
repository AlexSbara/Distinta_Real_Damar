import {signIn} from '@/auth';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {error}=await searchParams;
 const ready=Boolean(process.env.AUTH_GOOGLE_ID&&process.env.AUTH_GOOGLE_SECRET&&process.env.AUTH_SECRET);
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}><section className="card" style={{maxWidth:420,padding:32}}><p className="eyebrow">REAL DAMAR</p><h1>Distinta 7</h1><p>Accedi con l’account Google autorizzato per gestire la rosa e le distinte.</p>{error&&<p role="alert">Accesso non riuscito. Usa un indirizzo autorizzato oppure riprova.</p>}{ready?<form action={async()=>{'use server';await signIn('google',{redirectTo:'/'});}}><button className="primary" type="submit">Accedi con Google</button></form>:<p role="status">L’accesso sarà disponibile appena la configurazione è completata.</p>}</section></main>;
}
