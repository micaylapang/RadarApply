import { SignupForm } from "@/components/SignupForm";
import { listInternships } from "@/lib/db";
import { INTERNSHIP_CATALOG } from "@/lib/internships";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getInternships() {
  if (!isSupabaseConfigured()) {
    return INTERNSHIP_CATALOG.map((item, i) => ({
      id: `catalog-${i}`,
      company: item.company,
      title: item.title,
      slug: item.slug,
      description: item.description,
      status: "closed",
      sourceType: item.sourceType,
    }));
  }

  try {
    const rows = await listInternships();
    if (rows.length > 0) {
      return rows.map((i) => ({
        id: i.id,
        company: i.company,
        title: i.title,
        slug: i.slug,
        description: i.description,
        status: i.status,
        sourceType: i.sourceType,
      }));
    }
  } catch (err) {
    console.error("[home] failed to load internships", err);
  }

  return INTERNSHIP_CATALOG.map((item, i) => ({
    id: `catalog-${i}`,
    company: item.company,
    title: item.title,
    slug: item.slug,
    description: item.description,
    status: "closed",
    sourceType: item.sourceType,
  }));
}

export default async function Home() {
  const internships = await getInternships();
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="page">
      <nav className="nav">
        <a className="brand" href="/">
          <span className="brand-fire" aria-hidden="true">
            🔥
          </span>
          <span className="brand-name">
            Drop<span>Text</span>
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
              Drop<em>Text</em>
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
            about. Our monitor polls career boards every second and fires SMS
            the instant a listing goes live.
          </p>
        </div>
        <SignupForm internships={internships} />
      </section>

      <footer className="footer">
        <span>🔥 DropText — internship drops, instantly.</span>
        <span>
          {supabaseReady
            ? "Watch loop every ~1 min on Vercel · SMS via Twilio"
            : "Add Supabase keys to .env to enable signups"}
        </span>
      </footer>
    </div>
  );
}
