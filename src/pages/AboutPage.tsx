const GALLERY_ITEMS = [
  { id: 'g1', title: 'Cultural Nights', desc: 'Live music, dance battles, and show-stopping performances.' },
  { id: 'g2', title: 'Tech Arena', desc: 'Hackathons, robotics, and product showcases made by students.' },
  { id: 'g3', title: 'Workshops', desc: 'Hands-on sessions with mentors across design, dev, and hardware.' },
  { id: 'g4', title: 'Campus Life', desc: 'A vibrant campus atmosphere with art, installations, and chill zones.' },
]

function AboutPage() {
  return (
    <div className="min-h-screen px-4 pb-16 pt-10 text-white md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="card isolate grid gap-6 p-6 md:p-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Discover</p>
            <h1 className="text-4xl font-semibold text-white md:text-5xl">About Incridea</h1>
            <p className="max-w-3xl text-base text-slate-300 md:text-lg">
              Innovate, Create, Ideate — a national-level techno-cultural fest crafted by students.
              We build the platforms, design the experiences, and host the performances that bring
              together technology, art, and community.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center text-sm text-slate-100 sm:max-w-md">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-2xl font-bold text-sky-200">40+</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Events</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-2xl font-bold text-emerald-200">45K</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Footfall</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-2xl font-bold text-amber-200">200</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Colleges</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-inner shadow-slate-950/50">
            <div className="aspect-video w-full">
              <iframe
                title="Incridea Promo"
                src="https://player.vimeo.com/video/1055845788?h=4cfe9089f7&badge=0&autopause=0&player_id=0&app_id=58479"
                width="100%"
                height="100%"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="h-full w-full"
              />
            </div>
          </div>
        </header>

        <section className="card isolate grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <img
                src="/nmamit.png"
                alt="NMAMIT logo"
                className="h-20 w-auto rounded-lg border border-slate-800 bg-slate-950/70 p-2 shadow-inner shadow-slate-950/40"
                loading="lazy"
              />
              <div className="space-y-1">
                <p className="muted">Nitte, Karnataka</p>
                <h3 className="text-xl font-semibold text-white">NMAM Institute of Technology</h3>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-300 md:text-base">
              Established in 1986 and now part of Nitte (Deemed to be University), NMAMIT is an
              off-campus centre with strong international collaborations. Programs span engineering,
              M.Tech, and MCA, backed by active research and innovation.
            </p>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
              <p className="font-semibold text-sky-200">Nitte DU · NMAMIT</p>
              <p className="mt-1 leading-6">
                The campus hosts Incridea, giving students the space and infrastructure to prototype,
                rehearse, and execute a fest that blends technology, culture, and community.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="muted">Built by students</p>
              <h3 className="text-2xl font-semibold text-white">Why Incridea stands out</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {GALLERY_ITEMS.map((item, index) => (
                <div
                  key={item.id}
                  className="isolate flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">0{index + 1}</p>
                    <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.desc}</p>
                  </div>
                  <span className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-slate-800/60 text-xs font-semibold text-sky-200">
                    ⚡
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card isolate grid gap-6 p-6 md:p-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <p className="muted">Experience</p>
            <h3 className="text-2xl font-semibold text-white">What to expect</h3>
            <p className="text-sm leading-6 text-slate-300 md:text-base">
              Pronites with renowned artists and DJs, competitions that test skill and teamwork, and
              workshops that encourage hands-on learning. Whether you are coding, building, or
              performing, there is a stage for you at Incridea.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-100 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <p className="text-xl font-bold text-sky-200">Workshops</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Hands-on</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <p className="text-xl font-bold text-emerald-200">Pronites</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Live acts</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <p className="text-xl font-bold text-amber-200">Showcases</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Projects</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-inner shadow-slate-950/40">
            <div className="aspect-4/3 w-full">
              <iframe
                title="Incridea Moments"
                src="https://player.vimeo.com/video/1055896700?h=4cfe9089f7&badge=0&autopause=0&player_id=0&app_id=58479"
                width="100%"
                height="100%"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="h-full w-full"
              />
            </div>
            <div className="border-t border-slate-800/60 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
              Highlights reel — soak in the vibe before you arrive.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutPage