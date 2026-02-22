import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600">Tars Chat</h1>
          <p className="text-gray-500 mt-1">Create your account to get started</p>
        </div>
        <SignUp fallbackRedirectUrl="/chat" />
      </div>
    </div>
  );
}
