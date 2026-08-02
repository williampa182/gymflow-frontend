import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasRole } from "@/lib/auth";
import type { Rol } from "@/types";

export function useRequireRole(rol: Rol | Rol[], destino = "/dashboard"): boolean {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const roles = Array.isArray(rol) ? rol : [rol];
  const rolesKey = roles.join("|");

  useEffect(() => {
    const rolesPermitidos = rolesKey.split("|") as Rol[];
    if (!hasRole(...rolesPermitidos)) {
      router.replace(destino);
      return;
    }
    setAutorizado(true);
  }, [rolesKey, destino, router]);

  return autorizado;
}
