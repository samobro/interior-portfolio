import { SignIn } from "@clerk/clerk-react";

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-luxuryBg px-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl p-8 bg-luxurySurface border border-white/10">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl text-white mb-2">Admin Login</h1>
            <p className="text-luxuryMuted">Access your portfolio dashboard</p>
          </div>

          <div className="flex justify-center">
            <SignIn forceRedirectUrl="/admin/dashboard" />
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-luxuryMuted text-center">
              This is a secure admin area. Only authorized users can access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
