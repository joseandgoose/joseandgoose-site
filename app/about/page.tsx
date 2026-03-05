export default function About() {
  return (
    <>

      {/* ── PAGE TITLE BLOCK ── */}
      <div className="page-header">
        <h1>About</h1>
        <p className="tagline">Product Manager and Dog </p>
      </div>

      {/* ── JUMP BAR ── */}
      <nav className="jump-bar">
        <div className="jump-inner">
          <span className="jump-label">Jump to</span>
          <a href="#jose">Jose</a>
          <a href="#goose">Goose</a>
        </div>
      </nav>

      {/* ── JOSE SECTION ── */}
      <section className="about-section" id="jose">
        <div className="about-grid">
          <div className="about-image">
              <img src="/about-jose.jpeg" alt="Jose" />
            <div className="about-image-placeholder">
              <span>Jose</span>
            </div>
          </div>
          <div className="about-content">
            <p className="about-eyebrow">Product &amp; Strategy</p>
            <h2 className="about-name">Jose Delgado</h2>
            <p className="about-body">
              Product Manager focused on direct-to-consumer experiences in the pet space —
              building products that make life better for pets and the people who love them.
            </p>
            <p className="about-body">
              Before product, Jose taught
              sixth grade through Teach for America,
              spent time on the trading floor at Goldman Sachs, and led Strategy &amp; Operations teams at
              DoorDash and Instacart. Each stop left its mark.
              The trading floor taught financial literacy. The classroom taught empathy to human learning. Ops taught
              him how to move fast without breaking things.
            </p>
            <p className="about-body">
              Rooted in curiosity, shaped by exploration.
            </p>
            <div className="about-tags">
              <span className="tag">Product Management</span>
              <span className="tag">DTC</span>
              <span className="tag">Pet Space</span>
              <span className="tag">Strategy &amp; Ops</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="about-divider" />

      {/* ── GOOSE SECTION ── */}
      <section className="about-section" id="goose">
        <div className="about-grid about-grid-reversed">
          <div className="about-content">
            <p className="about-eyebrow">Chief Inspiration Officer</p>
            <h2 className="about-name">Goose</h2>
            <p className="about-body">
              Miniature Schnauzer. Born in Texas, raised in Brooklyn, settled in Los Angeles.
              A true coastal dog with a big personality and even bigger eyebrows.
            </p>
            <p className="about-body">
              Goose is the kind of dog who takes his morning hikes seriously, plays fetch
              like he has something to prove, and has perfected the art of the sun nap.
              He has strong opinions about everything — especially sticks.
            </p>
            <p className="about-body">
              The site is named after him. He knows it.
            </p>
            <div className="about-tags">
              <span className="tag">Miniature Schnauzer</span>
              <span className="tag">Los Angeles</span>
              <span className="tag">Hiker</span>
              <span className="tag">Sun Napper</span>
            </div>
          </div>
          <div className="about-image">
              <img src="/about-goose.jpg" alt="Goose" />
            <div className="about-image-placeholder about-image-placeholder-goose">
              <span>Goose</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}