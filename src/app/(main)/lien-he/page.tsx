import { redirect } from "next/navigation";

export { generateMetadata } from "../contact/page";

export default function LienHePage() {
  redirect("/contact");
}
