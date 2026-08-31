"use client";

import { useState } from "react";
import { Button } from "@machi-asia/ui";
import { MediaLibraryModal } from "./MediaLibraryModal";
import type { MediaLibraryModalProps } from "./MediaLibraryModal";

export type MediaPageProps = Pick<MediaLibraryModalProps, "apiBasePath" | "gatewayUrl">;

export function MediaPage({ apiBasePath, gatewayUrl }: MediaPageProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Media Library</h1>
      <p style={{ marginBottom: "1.5rem", opacity: 0.7 }}>
        Manage and organize your media assets.
      </p>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Open Media Library
      </Button>
      <MediaLibraryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        apiBasePath={apiBasePath}
        gatewayUrl={gatewayUrl}
      />
    </main>
  );
}