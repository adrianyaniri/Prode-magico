import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
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

  // Check admin role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!roleData || roleData.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#111118] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">403</h1>
          <p className="mt-2 text-zinc-400">Acceso denegado. Solo administradores.</p>
          <a
            href="/matches"
            className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#111118]"
          >
            Ir a Partidos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-[#111118]">
      {/* Admin nav */}
      <nav className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
        <a
          href="/admin"
          className="text-sm font-medium text-zinc-400 hover:text-white"
        >
          General
        </a>
        <a
          href="/admin/invite-codes"
          className="text-sm font-medium text-zinc-400 hover:text-white"
        >
          Códigos
        </a>
        <a
          href="/admin/results"
          className="text-sm font-medium text-zinc-400 hover:text-white"
        >
          Resultados
        </a>
        <a
          href="/matches"
          className="ml-auto text-sm text-zinc-600 hover:text-zinc-400"
        >
          ← Volver
        </a>
      </nav>
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
