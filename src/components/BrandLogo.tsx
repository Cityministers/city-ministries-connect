export function BrandLogo({ titleClassName = "" }: { titleClassName?: string }) {
  return (
    <span className="flex items-center justify-center">
      <span className={`brand-wordmark ${titleClassName}`.trim()}>City Ministers</span>
    </span>
  );
}
