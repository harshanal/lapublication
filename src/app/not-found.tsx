import Link from "next/link";

export default function NotFound() {
  return <main className="app-shell"><section className="empty-state"><h1>ප්‍රකාශනය හමු නොවීය</h1><p>මෙම සබැඳිය වෙනස් වී හෝ ප්‍රකාශනය ඉවත් කර තිබිය හැක.</p><Link className="button-primary" href="/publications">නාමාවලියට යන්න</Link></section></main>;
}
