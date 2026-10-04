import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {canSignInWithGoogle} from '@/lib/allowed-users';
export const {handlers,auth,signIn,signOut}=NextAuth({
 providers:[Google({authorization:{params:{prompt:'select_account'}}})],
 session:{strategy:'jwt',maxAge:7*24*60*60},pages:{signIn:'/login',error:'/login'},
 callbacks:{signIn({account,profile}){return canSignInWithGoogle(account?.provider,profile);}},
});
