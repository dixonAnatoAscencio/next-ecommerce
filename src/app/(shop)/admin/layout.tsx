import { auth } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  //Proteger rutas administrativas
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user.role !== "admin") {
    redirect("/login");
  }

  return <div>{children}</div>;
}
