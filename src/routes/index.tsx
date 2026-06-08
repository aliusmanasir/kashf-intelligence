import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KashfLogo } from "@/components/KashfLogo";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      navigate({ to: data.user ? "/daily" : "/welcome", replace: true });
    });
  }, [navigate]);
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <KashfLogo size={64} />
    </div>
  );
}
