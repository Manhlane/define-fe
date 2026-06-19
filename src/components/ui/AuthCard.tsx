import React from "react";

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export default function AuthCard({
  title,
  description,
  children,
  footer,
  className = "",
}: Props) {
  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div
        className={`rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow)] ${className}`}
      >
        {title && <h1 className="mb-1 text-2xl font-semibold text-[var(--app-foreground)]">{title}</h1>}
        {description && (
          <p className="mb-4 text-sm text-[var(--app-muted)]">{description}</p>
        )}
        {children}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}
