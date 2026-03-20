import { redirect } from "next/navigation";

export { metadata } from "../privacy/page";

export default function ChinhSachBaoMatPage() {
  redirect("/privacy");
}
