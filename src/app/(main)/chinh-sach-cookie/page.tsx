import { redirect } from "next/navigation";
export { metadata } from "../cookie-policy/page";

export default function CookiePolicyAliasPage() {
  redirect("/cookie-policy");
}

