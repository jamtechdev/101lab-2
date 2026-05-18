export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
      <span
        className="h-3 w-0.5 rounded-full bg-accent/70 shrink-0"
        aria-hidden="true"
      />
      <h3 className="text-[10px] text-sidebar-foreground/55 uppercase tracking-[0.14em] font-semibold">
        {title}
      </h3>
    </div>
  );
}
