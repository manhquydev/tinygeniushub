import { redirect } from "next/navigation";
export { generateMetadata } from "../cookie-policy/page";

export default function CookiePolicyAliasPage() {
  redirect("/cookie-policy");
}

