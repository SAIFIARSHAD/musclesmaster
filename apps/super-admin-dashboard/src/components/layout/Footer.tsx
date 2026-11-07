export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-5 py-5 sm:px-8">
      <div className="flex flex-col items-center justify-between gap-2 text-center text-[11px] text-slate-400 sm:flex-row sm:text-left">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="font-semibold text-[#14243B]">
            MusclesMaster AI
          </span>
          . All rights reserved.
        </p>

        <p className="font-semibold tracking-wide text-[#F4510B]">
          POWERING PIONEER VENTURES GROUP
        </p>
      </div>
    </footer>
  );
}
