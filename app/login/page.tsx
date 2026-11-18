'use client';
import { useEffect,useState,type FormEvent } from 'react';
import { safeReturnTo } from '@/lib/password-crypto';
export default function Login(){
 const [mode,setMode]=useState<'login'|'register'>('login'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[returnTo,setReturnTo]=useState('/');
 useEffect(()=>{setReturnTo(safeReturnTo(new URLSearchParams(window.location.search).get('return_to')));},[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=new FormData(event.currentTarget);
  if(mode==='register'&&form.get('password')!==form.get('confirmPassword')){setError('The passwords do not match.');return;}
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/auth/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,name:form.get('name'),email:form.get('email'),password:form.get('password'),setupCode:form.get('setupCode'),returnTo}),signal:AbortSignal.timeout(30000)});
   const result=await response.json().catch(()=>null) as {error?:string;redirectTo?:string}|null;
   if(!response.ok||!result?.redirectTo)throw new Error(result?.error||'Sign-in could not be completed. Please try again.');
   window.location.assign(safeReturnTo(result.redirectTo));
  }catch(e){setError(e instanceof TypeError?'Could not connect. Please check your connection and try again.':(e as Error).name==='TimeoutError'?'Sign-in took too long. Please try again.':(e as Error).message);setBusy(false);}
 }
 return <main className="auth-page"><section className="auth-card"><a className="auth-brand" href="/">LSUA Club Hub</a><h1>{mode==='login'?'Welcome back.':'Find your people.'}</h1><p>{mode==='login'?'Sign in with your Club Hub email and password.':'Create your Club Hub account to apply, submit proposals, and follow your clubs.'}</p><div className="auth-tabs" aria-label="Account options"><button type="button" disabled={busy} aria-pressed={mode==='login'} onClick={()=>{setMode('login');setError('');}}>Sign in</button><button type="button" disabled={busy} aria-pressed={mode==='register'} onClick={()=>{setMode('register');setError('');}}>Create account</button></div><form key={mode} className="stack-form" onSubmit={submit}><fieldset disabled={busy} style={{border:0,padding:0,margin:0,display:'grid',gap:16}}>{mode==='register'&&<label>Your name<input name="name" required maxLength={100} autoComplete="name"/></label>}<label>Email<input name="email" type="email" required maxLength={254} autoComplete="email"/></label><label>Password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete={mode==='register'?'new-password':'current-password'}/></label>{mode==='register'&&<><small>Use 12–128 characters and a password unique to Club Hub.</small><label>Confirm password<input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label></>}<details><summary>Admin or representative setup <span>(optional)</span></summary><label>Private setup code<input name="setupCode" type="password" maxLength={160} autoComplete="off"/></label><small>Only use a code provided by the site owner for your exact email. Creating an account does not grant reviewer access.</small></details>{error&&<p className="notice error" role="alert">{error}</p>}<button className="button primary full" type="submit">{busy?'Please wait…':mode==='register'?'Create account':'Sign in'}</button></fieldset></form><p className="auth-help">This is a Club Hub account. Do not enter your university password. Email addresses are self-reported and are not university-verified.</p><a href="/">Back to the directory</a></section></main>;
}
