import { redirect } from "next/navigation";

export { metadata } from "../contact/page";

export default function LienHePage() {
  redirect("/contact");
}
