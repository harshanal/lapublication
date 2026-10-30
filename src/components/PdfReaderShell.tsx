"use client";

import dynamic from "next/dynamic";

const PdfReader = dynamic(() => import("@/components/PdfReader").then((module) => module.PdfReader), {
  ssr: false,
  loading: () => <div className="reader-loading">PDF කියවනය සූදානම් කරමින්…</div>
});

export function PdfReaderShell(props: { url: string; title: string; downloadUrl: string }) {
  return <PdfReader {...props} />;
}
