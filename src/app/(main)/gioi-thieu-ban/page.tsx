import { redirect } from "next/navigation";

export { generateMetadata } from "../referral/page";

export default function GioiThieuBanPage() {
  redirect("/referral");
}
