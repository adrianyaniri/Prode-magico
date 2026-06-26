import SignInForm from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-4" style={{ backgroundImage: 'url("/stadium-bg.jpg")' }}>
      <div className="absolute inset-0 bg-[#111118]/80 backdrop-blur-sm" />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <SignInForm />
      </div>
    </div>
  );
}
