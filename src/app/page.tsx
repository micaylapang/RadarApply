import { SignupForm } from "@/components/SignupForm";
import { INTERNSHIP_CATALOG } from "@/lib/internships";
import { isSupabaseConfigured } from "@/lib/supabase";

// Fast first paint — do not block the page on Supabase
export const dynamic = "force-static";

const catalogInternships = INTERNSHIP_CATALOG.map((item, i) => ({
  id: `catalog-${i}`,
  company: item.company,
  title: item.title,
  slug: item.slug,
  description: item.description,
  status: "closed",
  sourceType: item.sourceType,
}));

export default function Home() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="page">
      <nav className="nav">
        <a className="brand" href="/">
          <span className="brand-fire" aria-hidden="true">
            🔥
          </span>
          <span className="brand-name">
            Radar<span>Apply</span>
          </span>
        </a>
        <div className="nav-pill">1 min watch loop</div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <h1 className="hero-brand">
            <span className="hero-fire" aria-hidden="true">
              🔥
            </span>
            <span className="brand-name">
              Radar<em>Apply</em>
            </span>
          </h1>
          <p className="hero-line">
            Get a text the second an internship application opens.
          </p>
          <div className="hero-actions">
            <a className="btn-primary" href="#signup">
              Start tracking
            </a>
            <a className="btn-ghost" href="#how">
              How it works
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="radar">
            <span className="radar-blip" />
            <span className="radar-blip" />
            <span className="radar-blip" />
          </div>
          <p className="radar-caption">Signal → SMS</p>
        </div>
      </header>

      <section className="section" id="how">
        <div className="section-head">
          <h2>Be the first to apply</h2>
          <p>
            Enter your name and number, then pick every internship you care
            about. Our monitor polls career boards and fires SMS the instant a
            listing goes live.
          </p>
        </div>
        <SignupForm initialInternships={catalogInternships} />
      </section>

      <footer className="footer">
        <span>🔥 RadarApply — internship drops, instantly.</span>
        <span>
          {supabaseReady
            ? "Watch loop every ~1 min on Vercel · SMS via Twilio"
            : "Add Supabase keys to .env to enable signups"}
        </span>
      </footer>
    </div>
  );
}
