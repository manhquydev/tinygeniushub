import { redirect } from "next/navigation";

export { metadata } from "../about/page";

export default function GioiThieuPage() {
  redirect("/about");
}
