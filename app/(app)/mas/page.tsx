import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  BookOpen,
  CalendarDays,
  Code,
  DatabaseBackup,
  FileSpreadsheet,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ListGroup, ListRow, RowIcon } from "@/components/ui/list";
import { getSettings } from "@/lib/settings";
import { ThemeToggle } from "@/components/pwa/theme-toggle";
import { NotificationsToggle } from "@/components/pwa/notifications-toggle";
import type { ThemeChoice } from "@/actions/theme";
import pkg from "@/package.json";
import {
  FarmNameRow,
  GestationRows,
  InstallRow,
  VaccinePresetsRow,
} from "./settings-rows";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = { title: "Más" };

const REPO_URL = "https://github.com/Ibonarambarri/MiExplotacion";

/** Enlace de descarga con el aspecto de una fila de lista. */
function DownloadRow({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <li>
      <a
        href={href}
        download
        className="pressable flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-accent/70"
      >
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium leading-snug">{title}</span>
          <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
            {subtitle}
          </span>
        </span>
      </a>
    </li>
  );
}

export default async function MasPage() {
  const [settings, cookieStore] = await Promise.all([getSettings(), cookies()]);
  const raw = cookieStore.get("theme")?.value;
  const theme: ThemeChoice = raw === "light" || raw === "dark" ? raw : "system";

  return (
    <div className="space-y-6">
      <PageHeader title="Más" description={settings.farmName} className="pb-0" />

      <ListGroup>
        <ListRow
          href="/calendario"
          leading={
            <RowIcon>
              <CalendarDays />
            </RowIcon>
          }
          title="Calendario"
          subtitle="Vacunas, partos y tratamientos"
        />
        <ListRow
          href="/mas/libro"
          leading={
            <RowIcon tone="harvest">
              <BookOpen />
            </RowIcon>
          }
          title="Libro de explotación"
          subtitle="Censo y registros del año, listo para imprimir"
        />
      </ListGroup>

      <ListGroup title="Explotación">
        <FarmNameRow value={settings.farmName} />
      </ListGroup>

      <ListGroup title="Gestación" footer="Días desde la cubrición hasta el parto previsto.">
        <GestationRows
          sheep={settings.sheepGestationDays}
          rabbit={settings.rabbitGestationDays}
        />
      </ListGroup>

      <ListGroup title="Vacunas">
        <VaccinePresetsRow presets={settings.vaccinePresets} />
      </ListGroup>

      <ListGroup title="Apariencia">
        <li className="px-4 py-3">
          <ThemeToggle initial={theme} />
        </li>
      </ListGroup>

      <ListGroup title="Notificaciones">
        <li className="px-4 py-3">
          <NotificationsToggle />
        </li>
      </ListGroup>

      <ListGroup title="App">
        <InstallRow />
      </ListGroup>

      <ListGroup
        title="Datos"
        footer="Las exportaciones solo leen datos; no modifican nada."
      >
        <DownloadRow
          href="/api/export/transactions"
          icon={
            <RowIcon tone="success">
              <FileSpreadsheet />
            </RowIcon>
          }
          title="Exportar movimientos (CSV)"
          subtitle="Ingresos y gastos para Excel"
        />
        <DownloadRow
          href="/api/export/backup"
          icon={
            <RowIcon tone="info">
              <DatabaseBackup />
            </RowIcon>
          }
          title="Copia de seguridad completa"
          subtitle="Todos los datos en un archivo JSON"
        />
      </ListGroup>

      <ListGroup title="Acerca de">
        <ListRow
          leading={
            <RowIcon tone="muted">
              <Info />
            </RowIcon>
          }
          title="Versión"
          trailing={<span className="tabular text-[15px] text-muted-foreground">{pkg.version}</span>}
        />
        <li>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="pressable flex min-h-14 w-full items-center gap-3 px-4 py-2.5 active:bg-accent/70"
          >
            <RowIcon tone="muted">
              <Code />
            </RowIcon>
            <span className="min-w-0 flex-1 text-[15px] font-medium">Código fuente</span>
            <span className="text-[13px] text-muted-foreground">GitHub</span>
          </a>
        </li>
      </ListGroup>

      <LogoutButton />
    </div>
  );
}
