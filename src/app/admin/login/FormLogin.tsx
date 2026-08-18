'use client'

import { useActionState } from 'react'
import { masuk } from '@/lib/admin/aksi'

export function FormLogin() {
  const [state, aksiForm, pending] = useActionState(masuk, undefined)

  return (
    <form action={aksiForm} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">Masuk Admin</h1>

      {state?.error ? (
        <p role="alert" className="rounded border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1">
        <span>Email</span>
        <input type="email" name="email" autoComplete="username" required />
      </label>

      <label className="flex flex-col gap-1">
        <span>Kata sandi</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>

      <button type="submit" disabled={pending}>
        {pending ? 'Memproses…' : 'Masuk'}
      </button>
    </form>
  )
}
