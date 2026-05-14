import { redirect } from "next/navigation";

export { generateMetadata } from "../privacy/page";

export default function ChinhSachBaoMatPage() {
  redirect("/privacy");
}
