import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090b] text-[#f5f6f8] flex flex-col items-center justify-center p-6 text-center">
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#e51d24] mb-4">
        [ 404 // NOT FOUND ]
      </span>
      <h1 className="font-display text-5xl sm:text-7xl uppercase tracking-wide text-white mb-6">
        PAGE NOT FOUND
      </h1>
      <p className="text-neutral-400 max-w-md mb-8 text-sm sm:text-base font-normal">
        The link you followed might be broken or the page may have been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-[#e51d24] text-white font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#ff3b42] transition-colors"
      >
        BACK TO HOME
      </Link>
    </div>
  );
}
