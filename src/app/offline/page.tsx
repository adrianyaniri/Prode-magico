"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111118] px-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">📡</div>
        <h1 className="text-2xl font-bold text-white">You&apos;re Offline</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Connect to the internet to see matches and make predictions.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-[#111118] transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
