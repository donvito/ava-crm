"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  companies: "Companies",
  contacts: "Contacts",
  deals: "Deals",
};

/** App header nav showing only the features enabled on the API server. */
export function Nav() {
  const [features, setFeatures] = useState<string[]>([]);
  const pathname = usePathname();
  const active = pathname.split("/")[1] ?? "";

  useEffect(() => {
    fetch("/api/meta/features")
      .then((res) => res.json())
      .then(({ features }) => setFeatures(features))
      .catch(() => setFeatures([]));
  }, []);

  return (
    <header className="app-header">
      <span className="brand">AVA CRM</span>
      <nav aria-label="Main">
        {features.map((name) => (
          <a
            key={name}
            href={`/${name}/`}
            aria-current={name === active ? "page" : undefined}
          >
            {LABELS[name] ?? name}
          </a>
        ))}
      </nav>
    </header>
  );
}
