import {auth} from '@/auth';
import {isAllowedEmail} from '@/lib/allowed-users';
export async function teamAccessError(){const session=await auth();if(!session?.user)return Response.json({error:'Accedi con Google per gestire la squadra.'},{status:401});if(!isAllowedEmail(session.user.email))return Response.json({error:'Questa anagrafica è riservata agli account autorizzati.'},{status:403});return null;}
