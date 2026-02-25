import { redirect } from "next/navigation";

export { metadata } from "../referral/page";

export default function GioiThieuBanPage() {
  redirect("/referral");
}
