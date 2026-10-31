"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownWideNarrow, Check, ChevronDown, Clock3, GlassWater, Heart, Martini, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { getCocktails } from "@/lib/api";
import type { Cocktail } from "@/lib/types";

type Tab = "discover" | "favorites";
type SortMode = "popular" | "az" | "za";

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage after mount to avoid hydration mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("cocktail-club-favorites");
      if (stored) setFavorites(JSON.parse(stored) as string[]);
    } catch {
      // Ignore malformed local storage and continue with an empty list.
    } finally {
      setHydrated(true);
    }
  }, []);

  const toggle = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { window.localStorage.setItem("cocktail-club-favorites", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { favorites, toggle, hydrated };
}

function CocktailCard({ cocktail, favorite, onFavorite, onOpen }: {
  cocktail: Cocktail; favorite: boolean; onFavorite: () => void; onOpen: () => void;
}) {
  return (
    <article className="cocktail-card">
      <button className="card-image-button" onClick={onOpen} aria-label={`View ${cocktail.name} details`}>
        <div className="card-image">
          {cocktail.image ? <img src={cocktail.image} alt={cocktail.name} loading="lazy" /> :
            <div className="image-placeholder"><Martini size={46} strokeWidth={1.2} /></div>}
          <span className="image-tag">{cocktail.category || cocktail.alcoholic || "Cocktail"}</span>
        </div>
      </button>
      <button className={`favorite-button ${favorite ? "is-favorite" : ""}`} onClick={onFavorite}
        aria-label={favorite ? "Remove from favourites" : "Add to favourites"} aria-pressed={favorite}>
        <Heart size={18} fill={favorite ? "currentColor" : "none"} />
      </button>
      <button className="card-copy" onClick={onOpen}>
        <span className="card-eyebrow">{cocktail.glass || "THE HOUSE COLLECTION"}</span>
        <span className="card-title">{cocktail.name}</span>
        <span className="card-bottom"><span>{cocktail.ingredients.length || "—"} ingredients</span><span className="card-arrow">↗</span></span>
      </button>
    </article>
  );
}

function CocktailModal({ cocktail, favorite, onFavorite, onClose }: {
  cocktail: Cocktail; favorite: boolean; onFavorite: () => void; onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close details"><X size={20} /></button>
        <div className="detail-visual">
          {cocktail.image ? <img src={cocktail.image} alt={cocktail.name} /> : <div className="image-placeholder"><Martini size={68} /></div>}
          <span className="detail-badge"><Sparkles size={13} /> THE PERFECT POUR</span>
        </div>
        <div className="detail-content">
          <p className="eyebrow">{cocktail.category || "COCKTAIL RECIPE"}</p>
          <h2 id="detail-title">{cocktail.name}</h2>
          <p className="detail-meta"><span><GlassWater size={16} /> {cocktail.glass || "Your favourite glass"}</span><span><Clock3 size={16} /> 5 min</span></p>
          <div className="detail-section">
            <div className="section-heading"><h3>What you’ll need</h3><span>{cocktail.ingredients.length} items</span></div>
            {cocktail.ingredients.length ? <ul className="ingredient-list">{cocktail.ingredients.map((item, i) =>
              <li key={`${item.name}-${i}`}><span className="ingredient-dot" /><span>{item.name}</span><span className="measure">{item.measure || "To taste"}</span></li>)}</ul> :
              <p className="muted">Ingredient details are not available for this cocktail.</p>}
          </div>
          {cocktail.instructions && <div className="detail-section"><h3>Make it yours</h3><p className="instructions">{cocktail.instructions}</p></div>}
          <button className={`primary-button modal-fav ${favorite ? "saved" : ""}`} onClick={onFavorite}>
            <Heart size={17} fill={favorite ? "currentColor" : "none"} /> {favorite ? "Saved to favourites" : "Save to favourites"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function CocktailExplorer() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["cocktails"], queryFn: getCocktails });
  const { favorites, toggle, hydrated } = useFavorites();
  const [tab, setTab] = useState<Tab>("discover");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [alcohol, setAlcohol] = useState("all");
  const [sort, setSort] = useState<SortMode>("popular");
  const [selected, setSelected] = useState<Cocktail | null>(null);

  const cocktails = data ?? [];
  const categories = useMemo(() => Array.from(new Set(cocktails.map(c => c.category).filter((v): v is string => Boolean(v)))).sort(), [cocktails]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = cocktails.filter(c => {
      const matchesSearch = !q || [c.name, c.category, c.glass, c.alcoholic, ...c.ingredients.map(i => i.name)]
        .some(v => v?.toLowerCase().includes(q));
      const matchesCategory = category === "all" || c.category === category;
      const matchesAlcohol = alcohol === "all" || (alcohol === "alcoholic"
        ? (c.alcoholic || "").toLowerCase().includes("alcoholic") && !(c.alcoholic || "").toLowerCase().includes("non")
        : (c.alcoholic || "").toLowerCase().includes("non"));
      const matchesTab = tab === "discover" || favorites.includes(c.id);
      return matchesSearch && matchesCategory && matchesAlcohol && matchesTab;
    });
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "za") list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [cocktails, search, category, alcohol, tab, favorites, sort]);

  const resetFilters = () => { setSearch(""); setCategory("all"); setAlcohol("all"); setSort("popular"); };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Cocktail Club home"><span className="brand-mark"><Martini size={20} /></span><span>cocktail<span className="brand-light">club</span><i>.</i></span></a>
        <nav className="top-nav" aria-label="Main navigation">
          <button className={tab === "discover" ? "nav-link active" : "nav-link"} onClick={() => setTab("discover")}>Discover</button>
          <button className={tab === "favorites" ? "nav-link active" : "nav-link"} onClick={() => setTab("favorites")}>Your favourites <span className="nav-count">{favorites.length}</span></button>
        </nav>
        <div className="top-note"><span className="status-dot" /> YOUR NEXT FAVOURITE AWAITS</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL DRINKS GUIDE</div>
          <h1>Good taste.<br /><em>Great spirits.</em></h1>
          <p>From timeless classics to your next unexpected favourite. Find the perfect pour for every kind of evening.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}>Explore collection <span>↘</span></button><span className="hero-caption"><Sparkles size={15} /> Made for curious palates</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-sun" />
          <div className="hero-drink"><div className="drink-glass"><div className="drink-liquid" /><div className="drink-ice ice-one" /><div className="drink-ice ice-two" /><div className="drink-garnish" /></div><div className="drink-stem" /><div className="drink-foot" /></div>
          <div className="art-label art-label-top">EST. FOR THE EVENING</div><div className="art-label art-label-bottom">01 / THE ART OF THE POUR</div>
          <div className="art-star">✳</div>
        </div>
      </section>

      <section className="collection" id="collection">
        <div className="collection-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> THE GOOD STUFF</p><h2>{tab === "favorites" ? "Your favourites" : "Find your flavour"}<span>.</span></h2><p className="section-subtitle">{tab === "favorites" ? "The ones worth coming back to." : "A little inspiration, one cocktail at a time."}</p></div>
          <div className="collection-count"><strong>{filtered.length.toString().padStart(2, "0")}</strong><span>DRINKS TO DISCOVER</span></div></div>

        <div className="toolbar">
          <label className="search-box"><Search size={19} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cocktails, ingredients..." aria-label="Search cocktails" />{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}<kbd>⌘ K</kbd></label>
          <div className="filter-group"><label className="select-wrap"><SlidersHorizontal size={15} /><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={14} /></label>
            <label className="select-wrap"><select value={alcohol} onChange={e => setAlcohol(e.target.value)} aria-label="Filter by alcohol"><option value="all">Any strength</option><option value="alcoholic">Alcoholic</option><option value="non-alcoholic">Non-alcoholic</option></select><ChevronDown size={14} /></label>
            <label className="select-wrap sort-select"><ArrowDownWideNarrow size={15} /><select value={sort} onChange={e => setSort(e.target.value as SortMode)} aria-label="Sort cocktails"><option value="popular">Featured</option><option value="az">Name: A–Z</option><option value="za">Name: Z–A</option></select><ChevronDown size={14} /></label>
          </div>
        </div>

        <div className="results-line"><span>{isLoading ? "Finding your next favourite..." : `SHOWING ${filtered.length} ${filtered.length === 1 ? "COCKTAIL" : "COCKTAILS"}`}</span><button onClick={resetFilters} className="reset-button">Reset filters <X size={13} /></button></div>

        {isLoading ? <div className="cocktail-grid">{Array.from({ length: 8 }, (_, i) => <div className="skeleton-card" key={i}><div className="skeleton-image" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div>
          : isError ? <div className="empty-state"><div className="empty-icon">!</div><h3>We couldn’t pour that.</h3><p>There was a problem connecting to the cocktail library. Check your connection and try again.</p><button className="primary-button" onClick={() => refetch()}>Try again <span>↻</span></button></div>
          : filtered.length ? <div className="cocktail-grid">{filtered.map(c => <CocktailCard key={c.id} cocktail={c} favorite={favorites.includes(c.id)} onFavorite={() => toggle(c.id)} onOpen={() => setSelected(c)} />)}</div>
          : <div className="empty-state"><div className="empty-icon"><Martini size={24} /></div><h3>{tab === "favorites" && !favorites.length ? "Your story starts here." : "Nothing shaken, yet."}</h3><p>{tab === "favorites" && !favorites.length ? "Tap the heart on any cocktail to keep it close." : "Try another search or loosen up your filters."}</p><button className="secondary-button" onClick={() => { if (tab === "favorites") setTab("discover"); resetFilters(); }}>Explore the collection <span>↗</span></button></div>}

        <footer className="collection-footer"><span>GOOD DRINKS. GOOD COMPANY.</span><span>PLEASE ENJOY RESPONSIBLY <span className="footer-heart">♥</span></span></footer>
      </section>

      {selected && <CocktailModal cocktail={selected} favorite={favorites.includes(selected.id)} onFavorite={() => toggle(selected.id)} onClose={() => setSelected(null)} />}
      <div className="mobile-bottom"><button onClick={() => setTab("discover")} className={tab === "discover" ? "mobile-active" : ""}><Martini size={18} />Discover</button><button onClick={() => setTab("favorites")} className={tab === "favorites" ? "mobile-active" : ""}><Heart size={18} />Favourites <span>{favorites.length}</span></button></div>
    </main>
  );
}
