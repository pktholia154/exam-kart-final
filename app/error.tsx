'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-4">
      <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-sm text-gray-600 mb-4">{error?.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#3A20BA] text-white rounded-lg text-sm font-medium hover:bg-[#2d1896] transition"
      >
        Try again
      </button>
    </div>
  );
}

