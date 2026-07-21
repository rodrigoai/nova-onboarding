export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand-logo ${light ? "brand-logo-light" : ""}`} aria-label="nova.money">
      no<span className="brand-v">v</span>a<span className="brand-money">.money</span>
    </span>
  );
}
