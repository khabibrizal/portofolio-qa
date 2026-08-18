// Halaman login sementara — cukup untuk menghijaukan test penjaga rute
// (Task 1). Server Action `masuk` dan tampilan pesan error dikerjakan di
// Task 2.
export default function HalamanLogin() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-xl font-semibold">Masuk Admin</h1>

        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input type="email" name="email" autoComplete="username" />
        </label>

        <label className="flex flex-col gap-1">
          <span>Kata sandi</span>
          <input type="password" name="password" autoComplete="current-password" />
        </label>

        <button type="submit">Masuk</button>
      </form>
    </main>
  )
}
