import RidgelineDitherFooter from "@/components/ui/ridgeline-dither-footer"
import { footerRange, person, work } from "@/data/site"
import { withBase } from "@/lib/url"

/** The site's dot mark, matching the favicon. */
function DotMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="9" cy="11" r="2" />
        <circle cx="15" cy="11" r="2" />
        <circle cx="21" cy="11" r="2" />
        <circle cx="9" cy="17" r="2" />
        <circle cx="15" cy="17" r="2" />
        <circle cx="9" cy="23" r="2" />
      </g>
      <circle cx="23" cy="21" r="3" fill="#f0562e" />
    </svg>
  )
}

export default function SiteFooter() {
  return (
    <RidgelineDitherFooter
      name={person.name}
      brandHref={withBase("/")}
      logo={<DotMark />}
      tagline="Data pipelines and AI systems, tested before they ship. Bengaluru, India."
      columns={[
        {
          title: "Work",
          links: work.map((w) => ({
            label: w.title,
            href: withBase(`/work/${w.slug}/`),
            badge: w.live ? "Live" : undefined,
          })),
        },
        {
          title: "Site",
          links: [
            { label: "About", href: withBase("/#about") },
            { label: "Experience", href: withBase("/#experience") },
            { label: "Contact", href: withBase("/#contact") },
          ],
        },
        {
          title: "Elsewhere",
          links: [
            { label: "GitHub", href: person.github },
            { label: "LinkedIn", href: person.linkedin },
            { label: "Email", href: `mailto:${person.email}` },
          ],
        },
      ]}
      socials={[
        { icon: "github", href: person.github },
        { icon: "linkedin", href: person.linkedin },
      ]}
      copyright={`© ${new Date().getFullYear()} ${person.name}`}
      credit={null}
      preset="night"
      palette={{
        paper: "#131210",
        ink: "#ede8df",
        muted: "#a39d92",
        line: "#2c2925",
        heart: "#f0562e",
        tones: ["#131210", "#191715", "#211f1c", "#2c2925", "#3b3732", "#544f48", "#7a746a"],
      }}
      seed={footerRange.seed}
      ridges={footerRange.ridges}
      pixel={footerRange.pixel}
      altimeter={false}
      maxWidth="100%"
      fontFamily='"Funnel Sans Variable", system-ui, sans-serif'
      monoFamily='"Fragment Mono", ui-monospace, Consolas, monospace'
      height="620px"
      className="site-footer"
    />
  )
}
