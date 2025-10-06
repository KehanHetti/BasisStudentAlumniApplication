// src/components/layout/Topbar.tsx

const Topbar = ({ title = 'Dashboard' }: { title?: string }) => {
  return (
    <header className="h-16 bg-ui-card-background/80 backdrop-blur border-b border-ui-border flex items-center justify-between px-4 md:px-6 shadow-custom-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-base md:text-lg font-bold text-ui-text-dark tracking-tight truncate max-w-[40vw]">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="btn-secondary hidden sm:inline-block">Create</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full grid place-items-center bg-logo-secondary-blue/10 text-logo-secondary-blue font-bold">A</div>
          <div className="hidden sm:block leading-tight">
            <p className="font-semibold text-sm text-ui-text-dark">Admin User</p>
            <p className="text-xs text-ui-text-light">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
