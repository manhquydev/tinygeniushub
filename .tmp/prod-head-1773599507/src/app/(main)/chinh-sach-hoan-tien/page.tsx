import { redirect } from "next/navigation";

export { metadata } from "../refund-policy/page";

export default function ChinhSachHoanTienPage() {
  redirect("/refund-policy");
}
