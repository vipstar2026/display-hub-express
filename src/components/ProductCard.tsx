type Props = {
  name: string;
  price: string;
  description: string;
  badge?: string;
};

export function ProductCard({ name, price, description, badge }: Props) {
  return (
    <div className="group relative rounded-2xl p-6 bg-gradient-card border border-border shadow-card hover:border-primary/60 hover:shadow-glow transition-smooth">
      {badge && (
        <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/20 text-glow border border-primary/40">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-display font-semibold">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="text-xs text-muted-foreground">শুরু</div>
          <div className="text-2xl font-display font-bold text-gradient">{price}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-secondary group-hover:bg-gradient-primary grid place-items-center transition-smooth">
          <span className="text-foreground group-hover:text-primary-foreground">→</span>
        </div>
      </div>
    </div>
  );
}
