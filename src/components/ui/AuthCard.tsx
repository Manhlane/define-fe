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
    <div className="w-full max-w-md mx-auto p-6">
      <div
        className={`rounded-2xl border shadow-sm bg-white p-6 ${className}`}
      >
        {title && <h1 className="text-2xl font-semibold mb-1">{title}</h1>}
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}
        {children}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}
