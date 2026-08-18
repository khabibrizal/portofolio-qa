import '../globals.css'

// Panel admin sengaja monolingual (D15) — tidak lewat [locale], jadi lang
// di-hardcode ke 'id' dan html/body disediakan di sini (root layout.tsx
// tidak menyediakannya karena dipakai bersama oleh pohon [locale]).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
