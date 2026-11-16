export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-7 lg:px-9">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} MusclesMaster AI. All rights reserved.
        </p>

        <p className="text-xs font-medium text-slate-400">
          Branch Management Console
        </p>
      </div>
    </footer>
  );
}
