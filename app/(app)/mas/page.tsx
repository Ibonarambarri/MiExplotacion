import Link from "next/link";
import { CalendarDays, LogOut } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";

export default function MasPage() {
  return (
    <div>
      <PageHeader title="Más" description="Otras secciones y ajustes" />
      <div className="grid gap-3">
        <Card>
          <CardContent className="p-0">
            <Link
              href="/calendario"
              className="flex items-center gap-3 p-4 hover:bg-accent/50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </span>
              <span className="flex flex-col">
                <span className="font-medium">Calendario</span>
                <span className="text-sm text-muted-foreground">
                  Eventos del mes
                </span>
              </span>
            </Link>
          </CardContent>
        </Card>

        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
