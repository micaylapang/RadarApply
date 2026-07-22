import { AboutSection } from "@/components/AboutSection";
import { FaqSection } from "@/components/FaqSection";
import { HeroActions } from "@/components/HeroActions";
import { LogoMarquee } from "@/components/LogoMarquee";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { TextPreview } from "@/components/TextPreview";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await getSessionUserId();
  const loggedIn = Boolean(userId);

  return (
    <div className="page">
      <SiteNav active="home" initialLoggedIn={loggedIn} />

      <header className="hero">
        <div className="hero-top">
          <div className="hero-alerts">
            <TextPreview />
          </div>
          <div className="hero-visual">
            <div className="radar" aria-hidden="true">
              <span className="radar-blip" />
              <span className="radar-blip" />
              <span className="radar-blip" />
            </div>
            <div className="radar-meta">
              <p className="radar-caption">Signal&nbsp;→&nbsp;SMS&nbsp;alert</p>
              <div className="radar-pill">1 min watch loop</div>
            </div>
          </div>
        </div>

        <div className="hero-copy">
          <div className="hero-brand-row">
            <h1 className="hero-brand">
              <span className="hero-fire" aria-hidden="true">
                🚨
              </span>
              <span className="brand-name">
                Radar<em>Apply</em>
              </span>
            </h1>
            <HeroActions initialLoggedIn={loggedIn} />
          </div>
          <LogoMarquee />
          <p className="hero-line">
            the fastest job alert system on the internet.
          </p>
        </div>
      </header>

      <AboutSection />

      <TestimonialsSection />

      <FaqSection />

      <SiteFooter />
    </div>
  );
}
