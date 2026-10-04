"use client";
import { useState } from "react";
import {useRouter} from "next/navigation";
export default function Login() {
  const router=useRouter();
  const [error,setError]=useState("");
  return <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 shadow"><h1 className="text-2xl font-semibold">Open CaseVault 2.0</h1><p className="my-4 text-slate-500">Enter your private workspace access key.</p><form onSubmit={async e=>{e.preventDefault();const token=new FormData(e.currentTarget).get("token");const r=await fetch("/api/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});if(r.ok)router.push("/");else setError("The access key was not accepted.");}}><input name="token" type="password" required autoComplete="current-password" className="w-full rounded border p-3"/><button className="mt-4 w-full rounded bg-indigo-600 p-3 text-white">Open workspace</button><p className="mt-3 text-red-600">{error}</p></form></div>;
}
