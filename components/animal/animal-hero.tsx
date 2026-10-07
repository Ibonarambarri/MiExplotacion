"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Camera, ChevronLeft, ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AnimalAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ListGroup, ListRow, RowIcon } from "@/components/ui/list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/animal/status-badge";
import { DeleteAnimalDialog } from "@/components/animal/data-tab";
import { compressPhoto } from "@/components/animal/photo-utils";
import { removeAnimalPhotoAction, setAnimalPhotoAction } from "@/actions/photos";
import { deleteSheepAction } from "@/actions/sheep";
import { deleteRabbitAction } from "@/actions/rabbits";
import type { AnimalStatus } from "@/lib/validations";

export function AnimalHero({
  kind,
  id,
  name,
  tagId,
  hasNickname,
  photo,
  status,
  age,
  mother,
  back,
  editHref,
}: {
  kind: "oveja" | "coneja";
  id: number;
  name: string;
  tagId: string;
  hasNickname: boolean;
  photo: string | null;
  status: AnimalStatus;
  age: string | null;
  mother: { href: string; label: string } | null;
  back: { href: string; label: string };
  editHref: string;
}) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    startTransition(async () => {
      try {
        const { photo: p, thumb } = await compressPhoto(file);
        const r = await setAnimalPhotoAction(kind, id, p, thumb);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success("Foto actualizada");
        setPhotoOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo procesar la foto");
      }
    });
  }

  function removePhoto() {
    startTransition(async () => {
      const r = await removeAnimalPhotoAction(kind, id);
      if (!r.ok) return void toast.error(r.error);
      toast("Foto quitada");
      setPhotoOpen(false);
    });
  }

  return (
    <header className="pb-4">
      <div className="flex items-center justify-between">
        {/* TODO(integración): usar PageHeader back={{href,label}} cuando exista. */}
        <Link
          href={back.href}
          className="pressable -ml-2 inline-flex h-11 items-center gap-0.5 rounded-lg px-2 text-[15px] font-medium text-primary"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          {back.label}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Más acciones"
          onClick={() => setMenuOpen(true)}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => setPhotoOpen(true)}
          aria-label={photo ? "Cambiar foto" : "Añadir foto"}
          className="pressable relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <AnimalAvatar name={name} seed={tagId} src={photo} size="xl" className="shadow-sm" />
          <span
            aria-hidden
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground"
          >
            <Camera className="h-4 w-4" />
          </span>
        </button>

        <h1 className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight">{name}</h1>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          {hasNickname && <span className="font-mono">{tagId}</span>}
          <StatusBadge status={status} />
          {age && <span className="tabular">{age}</span>}
        </div>
        {mother && (
          <p className="mt-1 text-sm text-muted-foreground">
            Hija de{" "}
            <Link href={mother.href} className="font-medium text-primary underline-offset-2 active:underline">
              {mother.label}
            </Link>
          </p>
        )}
      </div>

      {/* Inputs ocultos: cámara trasera directa o galería. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFile}
      />

      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto de {name}</DialogTitle>
            <DialogDescription>Se guarda comprimida; no hace falta que sea perfecta.</DialogDescription>
          </DialogHeader>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={`Foto de ${name}`}
              className="aspect-square w-full rounded-2xl object-cover"
            />
          )}
          <div className="grid gap-2">
            <Button size="lg" disabled={pending} onClick={() => cameraRef.current?.click()}>
              <Camera className="h-4 w-4" aria-hidden />
              {pending ? "Guardando…" : "Hacer foto"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={pending}
              onClick={() => galleryRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" aria-hidden />
              Elegir de la galería
            </Button>
            {photo && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={pending}
                onClick={removePhoto}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Quitar foto
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
          </DialogHeader>
          <ListGroup>
            <ListRow
              onClick={() => {
                setMenuOpen(false);
                setPhotoOpen(true);
              }}
              leading={
                <RowIcon tone="info">
                  <Camera />
                </RowIcon>
              }
              title={photo ? "Cambiar foto" : "Añadir foto"}
            />
            <ListRow
              href={editHref}
              leading={
                <RowIcon tone="primary">
                  <Pencil />
                </RowIcon>
              }
              title="Editar datos"
            />
            <ListRow
              onClick={() => {
                setMenuOpen(false);
                setAskDelete(true);
              }}
              leading={
                <RowIcon tone="destructive">
                  <Trash2 />
                </RowIcon>
              }
              title={<span className="text-destructive">Eliminar {kind}</span>}
            />
          </ListGroup>
        </DialogContent>
      </Dialog>

      <DeleteAnimalDialog
        open={askDelete}
        onOpenChange={setAskDelete}
        onDelete={async () => {
          if (kind === "oveja") await deleteSheepAction(id);
          else await deleteRabbitAction(id);
        }}
      />
    </header>
  );
}
