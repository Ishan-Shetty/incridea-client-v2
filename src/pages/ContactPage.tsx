import { MdCall, MdLocationOn, MdMail } from 'react-icons/md'

function ContactPage() {
  return (
    <div className="min-h-screen px-4 pb-16 pt-10 text-white md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Reach Out</p>
          <h1 className="text-4xl font-semibold text-white md:text-6xl">Contact Us</h1>
          <p className="mx-auto max-w-3xl text-base text-slate-300 md:text-lg">
            Any queries should be directed to the student organisers and college staff at the
            following contact information.
          </p>
        </header>

        <section className="card space-y-6 p-6 md:p-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-slate-950/50">
              <div className="flex items-center gap-2 text-lg font-semibold md:text-xl">
                <MdMail className="text-sky-300" />
                <span>Mail</span>
              </div>
              <a
                href="mailto:incridea@nmamit.in"
                className="mt-3 inline-flex items-center gap-2 text-slate-200 underline-offset-4 hover:text-sky-200 hover:underline"
              >
                incridea@nmamit.in
              </a>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-slate-950/50">
              <div className="flex items-center gap-2 text-lg font-semibold md:text-xl">
                <MdCall className="text-amber-300" />
                <span>Phone Numbers</span>
              </div>
              <div className="mt-3 space-y-2 text-slate-200">
                <p>
                  General Query: <a className="hover:text-sky-200 hover:underline" href="tel:9449530107">+91 94495 30107</a>{' '}
                  or <a className="hover:text-sky-200 hover:underline" href="tel:9513295282">+91 95132 95282</a>
                </p>
                <p>
                  Technical Query: <a className="hover:text-sky-200 hover:underline" href="tel:9448846524">+91 94488 46524</a>{' '}
                  or <a className="hover:text-sky-200 hover:underline" href="tel:9686356123">+91 96863 56123</a>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-slate-950/50">
              <div className="flex items-center gap-2 text-lg font-semibold md:text-xl">
                <MdLocationOn className="text-emerald-300" />
                <span>Address</span>
              </div>
              <div className="mt-3 space-y-3 text-slate-200">
                <div>
                  <p>NMAM Institute of Technology,</p>
                  <p>Nitte, Karkala Taluk, Udupi,</p>
                  <p>Karnataka, India - 574110</p>
                </div>
                <div>
                  <p>A unit of Nitte (Deemed to be University), Nitte Education Trust</p>
                  <p>6th Floor, University Enclave,</p>
                  <p>Medical Sciences Complex,</p>
                  <p>Deralakatte, Mangaluru - 575018</p>
                  <p>Karnataka, India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-xl shadow-slate-950/40">
            <div className="aspect-[16/9] w-full">
              <iframe
                title="NMAMIT Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3884.6730538655893!2d74.92911808195412!3d13.183002554024787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbb56415ad85e5b%3A0x10b77ac6f6afc7fa!2sNitte%20Mahalinga%20Adyantaya%20Memorial%20Institute%20of%20Technology!5e0!3m2!1sen!2sin!4v1738765768735!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ContactPage
