import { useEffect } from "react";

export function usePageTitle(titulo: string) {
  useEffect(() => {
    const previo = document.title;
    document.title = `${titulo} | GymFlow`;
    return () => {
      document.title = previo;
    };
  }, [titulo]);
}
