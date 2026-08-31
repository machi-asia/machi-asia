"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, MessageCircle } from "lucide-react";
import { RoseChat, type RoseChatProps } from "./RoseChat";

/* ------------------------------------------------------------------ */
/*  Context — shared open / close state between all triggers + modal  */
/* ------------------------------------------------------------------ */

interface RoseChatModalCtx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const RoseChatModalContext = createContext<RoseChatModalCtx>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

function useRoseChatModalContext() {
  return useContext(RoseChatModalContext);
}

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export interface RoseChatModalProviderProps {
  children: ReactNode;
}

export function RoseChatModalProvider({ children }: RoseChatModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <RoseChatModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </RoseChatModalContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal — full-screen overlay containing RoseChat                   */
/* ------------------------------------------------------------------ */

export type RoseChatModalProps = Omit<RoseChatProps, "className"> & {
  /** Extra class on the overlay container. */
  className?: string;
};

export function RoseChatModal({ className, ...roseChatProps }: RoseChatModalProps) {
  const { isOpen, close } = useRoseChatModalContext();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={`rose-chat-modal-overlay${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <button
        className="rose-chat-modal-close"
        onClick={close}
        aria-label="Close Rose chat"
        type="button"
      >
        <X size={18} />
      </button>
      <RoseChat {...roseChatProps} className="rose-chat-modal-app" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trigger — Action Button                                           */
/* ------------------------------------------------------------------ */

export interface RoseChatModalActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: ReactNode;
}

export function RoseChatModalActionButton({
  label = "Chat with Rose",
  icon,
  className,
  onClick,
  ...rest
}: RoseChatModalActionButtonProps) {
  const { open } = useRoseChatModalContext();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      open();
    },
    [onClick, open],
  );

  return (
    <button
      type="button"
      className={`rose-chat-action-btn${className ? ` ${className}` : ""}`}
      onClick={handleClick}
      {...rest}
    >
      {icon ?? <MessageCircle className="rose-chat-action-btn-icon" size={18} />}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Trigger — Floating Action Button                                  */
/* ------------------------------------------------------------------ */

export interface RoseChatModalFloatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export function RoseChatModalFloatingButton({
  icon,
  className,
  onClick,
  ...rest
}: RoseChatModalFloatingButtonProps) {
  const { open } = useRoseChatModalContext();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      open();
    },
    [onClick, open],
  );

  return (
    <button
      type="button"
      className={`rose-chat-fab${className ? ` ${className}` : ""}`}
      onClick={handleClick}
      aria-label="Open Rose chat"
      {...rest}
    >
      {icon ?? <MessageCircle className="rose-chat-fab-icon" size={24} />}
    </button>
  );
}
