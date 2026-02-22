import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <AuthForm mode="login" />
    </div>
  );
}
