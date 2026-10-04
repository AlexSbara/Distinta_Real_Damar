import DistintaApp from '@/components/distinta-app';
import {auth,signOut} from '@/auth';
import {isAllowedEmail} from '@/lib/allowed-users';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page(){const session=await auth();if(!session?.user)redirect('/login');if(!isAllowedEmail(session.user.email))return <main style={{padding:40}}><h1>Anagrafica riservata</h1><p>Accedi con un account autorizzato per Real Damar.</p><form action={async()=>{'use server';await signOut({redirectTo:'/login'});}}><button type="submit">Cambia account</button></form></main>;return <><DistintaApp/><form style={{position:'fixed',bottom:12,right:16,zIndex:10}} action={async()=>{'use server';await signOut({redirectTo:'/login'});}}><button className="secondary" type="submit">Esci</button></form></>;}
