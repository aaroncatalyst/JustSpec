'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { company_name: companyName },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="bg-[#eaf3ef] text-[#1a6b4a] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1a1a18] mb-2">Check your email</h2>
          <p className="text-sm text-[#8a8a82] mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="text-[#1a6b4a] font-medium text-sm hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold mb-8">
          <span className="text-[#1a1a18]">just</span>
          <span className="text-[#1a6b4a]">spec</span>
        </Link>

        <div className="bg-white border border-[#e8e8e2] rounded-2xl p-8">
          <h1 className="text-xl font-bold text-[#1a1a18] mb-1">Create account</h1>
          <p className="text-sm text-[#8a8a82] mb-6">
            Your first RFQ is free. No credit card required.
          </p>

          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#e8e8e2] rounded-lg px-4 py-3 text-sm font-medium text-[#1a1a18] hover:bg-[#fafaf7] transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#e8e8e2]" />
            <span className="text-xs text-[#8a8a82]">or continue with email</span>
            <div className="flex-1 h-px bg-[#e8e8e2]" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1a1a18]">Company name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                className="border border-[#e8e8e2] rounded-lg px-4 py-3 text-sm text-[#1a1a18] placeholder:text-[#8a8a82] focus:outline-none focus:ring-2 focus:ring-[#1a6b4a]/30 focus:border-[#1a6b4a] bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1a1a18]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="border border-[#e8e8e2] rounded-lg px-4 py-3 text-sm text-[#1a1a18] placeholder:text-[#8a8a82] focus:outline-none focus:ring-2 focus:ring-[#1a6b4a]/30 focus:border-[#1a6b4a] bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1a1a18]">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="border border-[#e8e8e2] rounded-lg px-4 py-3 text-sm text-[#1a1a18] placeholder:text-[#8a8a82] focus:outline-none focus:ring-2 focus:ring-[#1a6b4a]/30 focus:border-[#1a6b4a] bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1a6b4a] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#155a3d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-[#8a8a82] text-center mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1a6b4a] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
