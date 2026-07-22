"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const STATS = [
  {
    label: "4×",
    text: "Early applicants are 4× more likely to get an interview.",
  },
  {
    label: "> 50%",
    text: "of selected interns were early applicants.",
  },
] as const;

const SPEED_POINTS = [
  "Recruiters typically review applications in the order received.",
  "Every minute matters.",
  "Timing can matter even more than your resume.",
] as const;

export function AboutSection() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const revealNodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const lagNodes = root.querySelectorAll<HTMLElement>("[data-reveal-lag]");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    // Stricter trigger so each ❌ point pops in only as it scrolls into view.
    const lagObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            lagObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.55, rootMargin: "0px 0px -28% 0px" },
    );

    revealNodes.forEach((node) => revealObserver.observe(node));
    lagNodes.forEach((node) => lagObserver.observe(node));

    return () => {
      revealObserver.disconnect();
      lagObserver.disconnect();
    };
  }, []);

  return (
    <section className="section about" id="about" ref={rootRef}>
      <div
        className="about-block about-problem"
        data-reveal
        style={{ "--d": "0.08s" } as CSSProperties}
      >
        <p className="about-kicker">Your problem</p>
        <h2>
          Tired of refreshing job boards to see if the roles you&apos;ve been
          eyeing have opened?
        </h2>
      </div>

      <div
        className="about-answer"
        data-reveal
        style={{ "--d": "0.12s" } as CSSProperties}
      >
        <div className="about-answer-connector" aria-hidden="true">
          <span className="about-answer-arrow" />
        </div>
        <p className="about-kicker about-answer-kicker">Our solution</p>
        <p className="about-answer-text">
          We save you the headache and send alerts straight to your phone{" "}
          <span className="about-answer-glow">the minute</span> your desired
          positions open. No lag. No&nbsp;missed&nbsp;emails.
        </p>
      </div>

      <ul className="about-lags" role="list">
        {[
          "LinkedIn posts jobs that have already been live for days.",
          "Most companies don't even send email alerts.",
          "Majority of people don't find out about openings until it's too late.",
        ].map((point) => (
          <li key={point} className="about-lag" data-reveal-lag>
            <span className="about-lag-mark" aria-hidden="true">
              ❌
            </span>
            <span className="about-lag-text">{point}</span>
          </li>
        ))}
      </ul>

      <p
        className="about-speed"
        data-reveal
        style={{ "--d": "0.05s" } as CSSProperties}
      >
        Speed is leverage.
      </p>

      <div className="about-pills" role="list">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="about-pill"
            role="listitem"
            data-reveal
            style={{ "--d": `${0.08 + i * 0.09}s` } as CSSProperties}
          >
            <span className="about-pill-label">{stat.label}</span>
            <span className="about-pill-rule" aria-hidden="true" />
            <span className="about-pill-text">{stat.text}</span>
          </div>
        ))}
      </div>

      <ul className="about-speed-points" role="list">
        {SPEED_POINTS.map((point, i) => (
          <li
            key={point}
            data-reveal
            style={{ "--d": `${0.1 + i * 0.08}s` } as CSSProperties}
          >
            <span className="about-speed-mark" aria-hidden="true">
              👉
            </span>
            <span className="about-speed-text">{point}</span>
          </li>
        ))}
      </ul>

      <div
        className="about-block about-solution"
        data-reveal
        style={{ "--d": "0.1s" } as CSSProperties}
      >
        <h3>
          The first system that checks job boards every minute. Not hour. Not
          day. <em>60 seconds.</em>
        </h3>
        <p className="about-lead about-monitor">
          We continuously monitor thousands of careers pages and send you an
          alert within seconds of a relevant opening.
        </p>
        <p className="about-lead about-silent">
          <span className="about-silent-line">
            Apply <span className="about-silent-before">before</span> the
            posting hits LinkedIn, the GitHub repo, or social media.
          </span>
          <br />
          <span className="about-silent-glow">
            This is your{" "}
            <span className="about-silent-accent">silent strategy</span>. 🏆
          </span>
        </p>
      </div>

      <div
        className="about-cta"
        data-reveal
        style={{ "--d": "0.08s" } as CSSProperties}
      >
        <a className="about-signup" href="/signup">
          Start Tracking
        </a>
      </div>
    </section>
  );
}
