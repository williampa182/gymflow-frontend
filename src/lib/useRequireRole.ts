import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasRole } from "@/lib/auth";
import type { Rol } from "@/types";

export function useRequireRole(rol: Rol, destino = "/dashboard"): boolean {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    if (!hasRole(rol)) {
      router.replace(destino);
      return;
    }
    setAutorizado(true);
  }, [rol, destino, router]);

  return autorizado;
}
