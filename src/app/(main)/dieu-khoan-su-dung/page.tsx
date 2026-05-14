import { redirect } from "next/navigation";

export { generateMetadata } from "../terms/page";

export default function DieuKhoanSuDungPage() {
  redirect("/terms");
}
