import { redirect } from "next/navigation";

export { metadata } from "../terms/page";

export default function DieuKhoanSuDungPage() {
  redirect("/terms");
}
