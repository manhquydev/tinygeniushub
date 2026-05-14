import { redirect } from "next/navigation";

export { generateMetadata } from "../about/page";

export default function GioiThieuPage() {
  redirect("/about");
}
