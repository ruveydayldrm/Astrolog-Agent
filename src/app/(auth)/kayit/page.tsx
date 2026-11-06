import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Kayıt ol" };

export default function SignupPage() {
  return <AuthForm mode="signup" next="/baslangic" />;
}
