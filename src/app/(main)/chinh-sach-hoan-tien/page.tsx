import { redirect } from "next/navigation";

export { generateMetadata } from "../refund-policy/page";

export default function ChinhSachHoanTienPage() {
  redirect("/refund-policy");
}
