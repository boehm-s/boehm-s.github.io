import { SkillBadge } from "./components/SkillBadge";
import { ExperienceItem } from "./components/ExperienceItem";
import { ProfilePicture } from "./components/ProfilePicture";
import { ShaderTrunkBackground } from "./components/ShaderTrunkBackground";
// import { VantaTrunkBackground } from "./components/VantaTrunkBackground";
import profileImage from "../imports/me.jpg";

export default function App() {
  const triggerScrollChaos = () => {
    window.dispatchEvent(new CustomEvent("vanta:app-scroll", { detail: { source: "app-scroll-container" } }));
  };

  const skills = [
    "Rust", "TypeScript", "Angular", "React",
    "PostgreSQL", "MongoDB", "Node.js", "Python",
    "Docker", "Kubernetes", "GCP", "NestJS"
  ];

  const experiences = [
    {
      title: "Full Stack Engineer",
      company: "Netwo",
      period: "August 2021 - Present",
      location: "Paris, France",
      description: "Working across the full technical stack, from frontend and APIs to infrastructure and database modeling, in close collaboration with product design and through pair programming."
    },
    {
      title: "Full Stack Developer",
      company: "EkoTrip",
      period: "November 2019 - July 2021",
      location: "France",
      description: "Maintained and extended the API, websocket layer, and Angular frontend, while also contributing to a new backend stack based on NestJS, MongoDB, and the ELK ecosystem."
    },
    {
      title: "Developer",
      company: "Seed-Up",
      period: "October 2016 - October 2019",
      location: "France",
      description: "Built innovative products spanning web platforms, NLP projects, embedded experiences, and cloud-linked storage systems using Node.js, React, Python, Docker, and early Rust."
    },
    {
      title: "Technical Assistant",
      company: "Prep'ETNA",
      period: "September 2016 - October 2016",
      location: "France",
      description: "Assisted and taught students C, UNIX, and web technologies during an intensive five-week programming bootcamp."
    }
  ];

  return (
    <div
      className="size-full bg-background text-foreground overflow-y-auto relative isolate"
      onScroll={triggerScrollChaos}
    >
      <ShaderTrunkBackground />
      {/* <VantaTrunkBackground /> */}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-8">
        <div className="flex items-center gap-16 flex-col md:flex-row max-w-5xl">
          <ProfilePicture src={profileImage} alt="Steven Boehm" />

          <div className="flex-1">
            <h1 className="text-[clamp(3rem,8vw,6rem)] tracking-tight mb-2 leading-[0.95]">
              Steven Boehm
            </h1>

            <p className="text-xl mb-4 tracking-wide opacity-70">
              Full Stack Engineer
            </p>

            <p className="text-muted-foreground max-w-xl mb-8 tracking-wide">
              Passionate problem solver and Rust enthusiast.
              <br />
              Building scalable solutions across the full stack.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {skills.map((skill) => (
                <SkillBadge key={skill}>
                  {skill}
                </SkillBadge>
              ))}
            </div>

            <div className="flex gap-8 flex-wrap">
              <a
                href="https://fr.linkedin.com/in/steven-boehm-2976bab1"
                target="_blank"
                rel="noopener noreferrer"
                className="tracking-wide border-b border-foreground/70 pb-1"
              >
                Get in Touch
              </a>

              <a
                href="https://github.com/boehm-s"
                target="_blank"
                rel="noopener noreferrer"
                className="tracking-wide border-b border-foreground/70 pb-1"
              >
                GitHub
              </a>

              <a
                href="https://stackoverflow.com/users/4756304/boehm-s"
                target="_blank"
                rel="noopener noreferrer"
                className="tracking-wide border-b border-foreground/70 pb-1"
              >
                Stack Overflow
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 text-sm text-muted-foreground tracking-widest z-10 opacity-50">
        <div className="text-right">
          <div>SCROLL</div>
          <div className="w-[1px] h-12 bg-muted-foreground mx-auto mt-2" />
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-24">
        <div>
          <h2 id="experience-title" className="text-[clamp(2rem,5vw,4rem)] tracking-tight mb-16">
            Experience
          </h2>

          <div className="space-y-16">
            {experiences.map((exp, index) => (
              <ExperienceItem key={index} {...exp} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
