import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch user role for NavBar admin link
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = roleData?.role === "admin";

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-[#111118]">
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <NavBar isAdmin={isAdmin} />
    </div>
  );
}
