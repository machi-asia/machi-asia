"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Button,
  Table,
  Gallery,
  Tabs,
  type GalleryItem,
  type TableColumn,
} from "@machi-asia/ui";
import { loadTokens } from "@machi-asia/auth";
import { mediaApiSubpath, isMediaSupabaseConfigured } from "../lib/env";

interface MediaRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  deleted_at: string | null;
}

export interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Base URL (origin + "/api/media-library") of the media API. Defaults to the
   * shared resolution in mediaApiBase() — NEXT_PUBLIC_GATEWAY_URL when set,
   * else same-origin "/api/media-library".
   */
  apiBasePath?: string;
  /**
   * @deprecated Prefer `apiBasePath`. Kept for backward compatibility: if both
   * are provided, `apiBasePath` wins.
   */
  gatewayUrl?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return loadTokens()?.accessToken ?? null;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  apiBasePath,
  gatewayUrl,
}: MediaLibraryModalProps) {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<"gallery" | "list">(
    "gallery",
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<{ unsubscribe: () => void } | null>(null);

  const base = mediaApiSubpath("media", apiBasePath ?? gatewayUrl);

  const fetchMedia = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(base, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    if (isOpen) fetchMedia();
  }, [isOpen, fetchMedia]);

  useEffect(() => {
    if (!isOpen) return;

    const token = getAuthToken();
    if (!token || !isMediaSupabaseConfigured()) return;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    import("@supabase/supabase-js").then(
      ({ createClient }) => {
        const client = createClient(supabaseUrl, anonKey, {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        });

        const channel = client
          .channel("media-changes")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "media",
            },
            (payload) => {
              const record = payload.new as MediaRecord;
              if (record.deleted_at) return;
              setItems((prev) => [record, ...prev]);
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "media",
            },
            (payload) => {
              const record = payload.new as MediaRecord;
              setItems((prev) =>
                prev.map((item) =>
                  item.id === record.id ? record : item,
                ),
              );
            },
          )
          .subscribe();

        channelRef.current = channel;
      },
    );

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [isOpen]);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getAuthToken();
    if (!token) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(base, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        await fetchMedia();
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    setDeleteId(null);
    try {
      const res = await fetch(`${base}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // silent
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.deleted_at === null &&
      item.file_name.toLowerCase().includes(search.toLowerCase()),
  );

  const galleryItems: GalleryItem[] = filteredItems.map((item) => ({
    id: item.id,
    src: item.file_url,
    alt: item.file_name,
    title: item.file_name,
    subtitle: formatFileSize(item.file_size),
  }));

  const tableColumns: TableColumn<MediaRecord>[] = [
    {
      key: "file_name",
      header: "Name",
      cell: (row) => (
        <span style={{ fontWeight: 500 }}>{row.file_name}</span>
      ),
      sortValue: (row) => row.file_name,
      sortable: true,
    },
    {
      key: "file_size",
      header: "Size",
      cell: (row) => formatFileSize(row.file_size),
      sortValue: (row) => row.file_size,
      sortable: true,
      align: "right",
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (row) => formatDate(row.created_at),
      sortValue: (row) => row.created_at,
      sortable: true,
      hideBelow: "sm",
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          variant="danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteId(row.id);
          }}
        >
          Delete
        </Button>
      ),
      align: "right",
      width: 100,
    },
  ];

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Media Library"
        size="lg"
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>
              {filteredItems.length} item
              {filteredItems.length !== 1 ? "s" : ""}
            </span>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          <Button
            variant="primary"
            size="sm"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </Button>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: "150px",
              padding: "0.4rem 0.75rem",
              border: "1px solid var(--ui-border, #ccc)",
              borderRadius: "6px",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <Tabs
            variant="pills"
            initialActiveId={activeView}
            onChange={(id) =>
              setActiveView(id as "gallery" | "list")
            }
            items={[
              {
                id: "gallery",
                label: "Gallery",
                content: <span style={{ display: "none" }} />,
              },
              {
                id: "list",
                label: "List",
                content: <span style={{ display: "none" }} />,
              },
            ]}
          />
        </div>

        {activeView === "gallery" ? (
          loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                opacity: 0.5,
              }}
            >
              Loading...
            </div>
          ) : galleryItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                opacity: 0.5,
              }}
            >
              No media found. Upload an image to get started.
            </div>
          ) : (
            <Gallery
              items={galleryItems}
              layout="grid"
              variant="card"
              columns={3}
              aspectRatio="1"
              enableLightbox
            />
          )
        ) : (
          <Table
            columns={tableColumns}
            data={filteredItems}
            rowKey={(row) => row.id}
            variant="striped"
            size="sm"
            loading={loading}
            emptyMessage="No media found."
          />
        )}
      </Modal>

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirm Delete"
        size="sm"
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                deleteId && handleDelete(deleteId)
              }
            >
              Delete
            </Button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete this media? This
          action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
