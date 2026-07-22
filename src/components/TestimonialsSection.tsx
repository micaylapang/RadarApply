const QUOTES = [
  {
    text: "GIRL WTF IVE NEEDED THIS",
    name: "Hannah L.",
  },
  {
    text: "I will be abusing this for job apps 😍",
    name: "Aayusha S.",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="section praise" id="praise" aria-labelledby="praise-title">
      <div className="praise-head">
        <p className="about-kicker">Word of mouth</p>
        <h2 id="praise-title">What people are saying about RadarApply</h2>
      </div>

      <ul className="praise-list" role="list">
        {QUOTES.map((quote) => (
          <li key={quote.name} className="praise-item">
            <blockquote className="praise-quote">
              <p>&ldquo;{quote.text}&rdquo;</p>
              <footer>
                <cite>{quote.name}</cite>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </section>
  );
}
