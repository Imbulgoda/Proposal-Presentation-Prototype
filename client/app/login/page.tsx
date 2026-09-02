import { redirect } from "next/navigation";
import { HUB_LOGIN_URL } from "@/lib/hub-auth";

export default function LoginPage() {
  redirect(HUB_LOGIN_URL);
}
