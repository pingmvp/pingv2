import { ExternalLink } from "lucide-react";

const team = [
  {
    name: "Joshua Lustig",
    title: "Co-Founder",
    school: "Northeastern University",
    major: "Game Design & Business Administration",
    bio: "Josh leads product, marketing, GTM strategy, and business operations for Togly. He brings a rare blend of product thinking and business execution.",
    linkedin: "https://www.linkedin.com/in/jelustig",
    initials: "JL",
  },
  {
    name: "Sabit Islam",
    title: "Co-Founder",
    school: "University of Michigan",
    major: "Computer Science & Data Science",
    bio: "Sabit is the technical architect behind Togly — driving full-stack engineering and all infrastructure that powers the matching platform.",
    linkedin: "https://www.linkedin.com/in/sabit-islam/",
    initials: "SI",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="bg-slate-950 border-y border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-24 space-y-16">
        {/* Header */}
        <div className="space-y-4 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Team</p>
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Built by people who&apos;ve been in the room.
          </h2>
          <p className="text-white/45 text-lg leading-relaxed">
            Togly started with a simple frustration: why do so many networking events feel like a
            waste of time? We believe in-person connection is irreplaceable — it just needs a
            smarter layer on top.
          </p>
        </div>

        {/* Team cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.07] rounded-2xl overflow-hidden">
          {team.map((member) => (
            <div key={member.name} className="bg-slate-950 p-10 space-y-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-lg font-bold text-white/70">{member.initials}</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">{member.name}</h3>
                <p className="text-sm text-primary">{member.title}</p>
                <p className="text-xs text-white/35">
                  {member.school} · {member.major}
                </p>
              </div>

              <p className="text-sm text-white/55 leading-relaxed">{member.bio}</p>

              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors duration-150"
              >
                <ExternalLink className="w-3 h-3" />
                LinkedIn
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
