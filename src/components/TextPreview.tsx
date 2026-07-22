const EXAMPLES = [
  {
    body: "Amazon SDE Internships for Summer 2027 just dropped. 🔥 Be the first to apply!",
    link: "https://www.amazon.jobs/en/jobs/2801847",
  },
  {
    body: "Two Sigma Quantitative Researcher Intern Summer 2027 just opened. 💨 Hurry, apply now:",
    link: "https://careers.twosigma.com/careers/JobDetail/New-York-New-York-United-States-Quantitative-Researcher-Intern-2027-Summer/13945",
  },
] as const;

function LinkParts({ url }: { url: string }) {
  try {
    const parsed = new URL(url);
    const origin = parsed.origin;
    const tail = `${parsed.pathname.replace(/^\//, "")}${parsed.search}`;
    return (
      <span className="sms-bubble-link-inner">
        {origin}/
        {tail ? (
          <span className="sms-bubble-link-tail">{tail}</span>
        ) : null}
      </span>
    );
  } catch {
    return <span className="sms-bubble-link-inner">{url}</span>;
  }
}

export function TextPreview() {
  return (
    <div className="sms-row" aria-hidden="true">
      {EXAMPLES.map((example, i) => (
        <div
          key={example.link}
          className="sms-preview"
          style={{ animationDelay: `${0.08 + i * 0.1}s` }}
        >
          <div className="sms-preview-meta">
            <p className="sms-preview-contact">RadarApply</p>
            <span className="sms-preview-now">now</span>
          </div>
          <div className="sms-bubble">
            <p className="sms-bubble-body">
              {example.body}{" "}
              <span className="sms-bubble-link">
                <LinkParts url={example.link} />
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
