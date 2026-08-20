"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

type PortfolioProject = {
  id?: string;
  category: string;
  title: string;
  client: string;
  year: string;
  copy: string;
  result: string;
  className: string;
  image?: string;
  videoUrl?: string;
  isDraft?: boolean;
};

const skills = [
  { name: "Search engine optimization", tag: "SEO", level: "Advanced" },
  { name: "Google Ads", tag: "Paid media", level: "Working knowledge" },
  { name: "Meta Ads", tag: "Paid media", level: "Working knowledge" },
  { name: "Content strategy", tag: "Content", level: "Advanced" },
  { name: "Google Analytics", tag: "Analytics", level: "Certified" },
  { name: "Social media analytics", tag: "Analytics", level: "Advanced" },
  { name: "Canva design", tag: "Creative", level: "Advanced" },
  { name: "AI image and video", tag: "Creative", level: "Working knowledge" },
  { name: "CRM software", tag: "Operations", level: "Working knowledge" },
];

const projects: PortfolioProject[] = [
  {
    id: "dental-content-strategy",
    category: "SEO",
    title: "Dental anxiety content strategy",
    client: "Consed International",
    year: "2025 - present",
    copy: "Search-led patient education content for a specialist dental audience.",
    result: "Content + intent alignment",
    className: "project-dental",
  },
  {
    id: "sedation-machine-seo",
    category: "SEO",
    title: "Conscious sedation machine",
    client: "Consed International",
    year: "SEO showcase",
    copy: "On-page SEO work around a high-intent product keyword.",
    result: "Ranked 1st for target keyword",
    className: "project-sedation",
  },
  {
    id: "seo-extensions-resource",
    category: "Content",
    title: "20 essential SEO extensions",
    client: "Naza Enterprises",
    year: "2022 - 2023",
    copy: "Educational resource designed to make practical SEO tooling accessible.",
    result: "Evergreen SEO education",
    className: "project-tools",
  },
];

const certifications = [
  "Social Media certified",
  "Sales Management certified",
  "Inbound Marketing certified",
  "Inbound Sales certified",
  "Frictionless Sales certified",
  "Google Analytics learning path",
];

const portfolioMediaUrl = "https://anand-philip-marketing-portfolio.round-egret-4062.chatgpt.site";
const headshotUrl = `${portfolioMediaUrl}/images/anand-philip-headshot.jpeg`;
const resumeUrl = `${portfolioMediaUrl}/Anand-Philip-Resume.pdf`;

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All work");
  const [studioOpen, setStudioOpen] = useState(false);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>(projects);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftClient, setDraftClient] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftVideoUrl, setDraftVideoUrl] = useState("");
  const [draftPhoto, setDraftPhoto] = useState("");
  const [studioError, setStudioError] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerLoginEnabled, setOwnerLoginEnabled] = useState(false);
  const [ownerLoginOpen, setOwnerLoginOpen] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerLoginError, setOwnerLoginError] = useState("");
  const [ownerLoginPending, setOwnerLoginPending] = useState(false);
  const filters = ["All work", "SEO", "Content", "Video"];
  const allProjects = portfolioProjects;
  const visibleProjects =
    activeFilter === "All work"
      ? allProjects
      : allProjects.filter((project) => project.category === activeFilter);

  useEffect(() => {
    try {
      const savedProjects = window.localStorage.getItem("anand-portfolio-projects");
      const savedDrafts = window.localStorage.getItem("anand-portfolio-work");
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects) as PortfolioProject[];
        if (Array.isArray(parsedProjects)) setPortfolioProjects(parsedProjects);
      } else if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts) as PortfolioProject[];
        if (Array.isArray(parsedDrafts)) setPortfolioProjects([...parsedDrafts, ...projects]);
      }
    } catch {
      // The portfolio remains usable if local browser storage is unavailable.
    } finally {
      setDraftsLoaded(true);
    }
  }, []);

  async function handleOwnerLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOwnerLoginError("");
    setOwnerLoginPending(true);

    try {
      const response = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ownerUsername, password: ownerPassword }),
      });
      const data = (await response.json()) as { isOwner?: boolean; error?: string };

      if (!response.ok || data.isOwner !== true) {
        throw new Error(data.error || "Unable to sign in.");
      }

      setIsOwner(true);
      setOwnerPassword("");
      setOwnerLoginOpen(false);
    } catch (error) {
      setOwnerLoginError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setOwnerLoginPending(false);
    }
  }

  async function handleOwnerLogout() {
    await fetch("/api/owner/logout", { method: "POST" });
    setIsOwner(false);
    closeWorkStudio();
  }

  useEffect(() => {
    if (!draftsLoaded) return;
    try {
      window.localStorage.setItem("anand-portfolio-projects", JSON.stringify(portfolioProjects));
    } catch {
      setStudioError("This image is too large to save in this browser. Try a smaller photo.");
    }
  }, [draftsLoaded, portfolioProjects]);

  useEffect(() => {
    let isActive = true;

    async function checkOwnerAccess() {
      try {
        const response = await fetch("/api/owner", { cache: "no-store" });
        const data = (await response.json()) as { isConfigured?: boolean; isOwner?: boolean };
        if (isActive) {
          setOwnerLoginEnabled(data.isConfigured === true);
          setIsOwner(data.isOwner === true);
        }
      } catch {
        if (isActive) {
          setOwnerLoginEnabled(false);
          setIsOwner(false);
        }
      }
    }

    void checkOwnerAccess();
    return () => {
      isActive = false;
    };
  }, []);

  function resetWorkDraft() {
    setDraftTitle("");
    setDraftClient("");
    setDraftDescription("");
    setDraftVideoUrl("");
    setDraftPhoto("");
    setStudioError("");
    setEditingProjectId(null);
  }

  function openNewWorkStudio() {
    if (!isOwner) return;
    resetWorkDraft();
    setStudioOpen(true);
  }

  function closeWorkStudio() {
    setStudioOpen(false);
    resetWorkDraft();
  }

  function handleEditWork(project: PortfolioProject) {
    if (!isOwner || !project.id) return;
    setDraftTitle(project.title);
    setDraftClient(project.client === "Personal work" ? "" : project.client);
    setDraftDescription(project.copy);
    setDraftVideoUrl(project.videoUrl || "");
    setDraftPhoto(project.image || "");
    setStudioError("");
    setEditingProjectId(project.id);
    setStudioOpen(true);
  }

  function handleDeleteWork(projectId: string) {
    if (!isOwner) return;
    if (!window.confirm("Delete this work from your portfolio?")) return;
    setPortfolioProjects((current) => current.filter((project) => project.id !== projectId));
    if (editingProjectId === projectId) closeWorkStudio();
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isOwner) return;
    const photo = event.target.files?.[0];
    if (!photo) return;
    if (!photo.type.startsWith("image/")) {
      setStudioError("Please choose an image file for the work cover.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraftPhoto(String(reader.result));
      setStudioError("");
    };
    reader.readAsDataURL(photo);
  }

  function handleAddWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isOwner) return;
    if (!draftPhoto) {
      setStudioError("Add a work photo before saving your draft.");
      return;
    }

    let videoUrl: URL;
    try {
      videoUrl = new URL(draftVideoUrl.trim());
      if (!["http:", "https:"].includes(videoUrl.protocol)) throw new Error("Invalid protocol");
    } catch {
      setStudioError("Paste a valid YouTube, Instagram, Drive, or Vimeo link.");
      return;
    }

    const workDetails: PortfolioProject = {
      id: editingProjectId || "work-" + Date.now(),
      category: "Video",
      title: draftTitle.trim(),
      client: draftClient.trim() || "Personal work",
      year: "Local draft",
      copy: draftDescription.trim() || "An edited video ready to include in the portfolio.",
      result: "Video link added",
      className: "project-uploaded",
      image: draftPhoto,
      videoUrl: videoUrl.toString(),
      isDraft: true,
    };

    setPortfolioProjects((current) =>
      editingProjectId
        ? current.map((project) => (project.id === editingProjectId ? workDetails : project))
        : [workDetails, ...current],
    );

    resetWorkDraft();
    setActiveFilter("All work");
    setStudioOpen(false);
  }

  return (
    <main className={`site ${isDark ? "dark" : "light"}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {ownerLoginOpen && !isOwner && (
        <div className="owner-login-backdrop" role="presentation">
          <form className="owner-login" onSubmit={handleOwnerLogin} aria-labelledby="owner-login-title">
            <button className="owner-login-close" type="button" onClick={() => setOwnerLoginOpen(false)} aria-label="Close owner login">×</button>
            <span>Private portfolio controls</span>
            <h2 id="owner-login-title">Owner sign in</h2>
            <p>Sign in to add, edit, or delete your work. Visitors cannot access these controls.</p>
            <label>Username<input autoComplete="username" required value={ownerUsername} onChange={(event) => setOwnerUsername(event.target.value)} /></label>
            <label>Password<input autoComplete="current-password" required type="password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} /></label>
            {ownerLoginError && <p className="owner-login-error" role="alert">{ownerLoginError}</p>}
            <button className="button button-primary" type="submit" disabled={ownerLoginPending}>{ownerLoginPending ? "Signing in..." : "Sign in"}</button>
          </form>
        </div>
      )}

      <header className="topbar page-shell">
        <a className="brand" href="#top" aria-label="Anand Philip home">
          <span>AP</span>
          <small>Digital marketing</small>
        </a>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Primary navigation">
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>
          <a href="#skills" onClick={() => setMenuOpen(false)}>Expertise</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={() => setIsDark((value) => !value)}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? "Light" : "Dark"}
          </button>
          <a className="contact-pill" href="#contact">Let's talk <span>↗</span></a>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <section className="hero page-shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Available for ambitious marketing teams</p>
          <h1>Marketing that earns attention <em>and</em> action.</h1>
          <p className="hero-lede">
            I&apos;m Anand Philip, a Digital Marketing Executive shaping useful search,
            social, and content experiences for brands ready to grow with intention.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">Explore selected work <span>→</span></a>
            <a className="button button-quiet" href={resumeUrl} download>Download resume <span>↓</span></a>
          </div>
          <div className="trust-row">
            <span>SEO</span><i />
            <span>Content</span><i />
            <span>Paid media</span><i />
            <span>Analytics</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Portrait of Anand Philip">
          <div className="hero-orbit orbit-one">SEO / CONTENT / GROWTH /</div>
          <div className="hero-orbit orbit-two" />
          <div className="portrait-backdrop" />
          <div className="portrait-card">
            <img src={headshotUrl} alt="Anand Philip in a formal suit" />
          </div>
          <div className="metric-float metric-top"><strong>2022</strong><span>marketing journey began</span></div>
          <div className="metric-float metric-bottom"><strong>01</strong><span>keyword ranked first</span></div>
          <div className="scroll-cue">SCROLL TO DISCOVER <span>↓</span></div>
        </div>
      </section>

      <section className="intro-strip page-shell" aria-label="Profile summary">
        <p>Strategy first. <b>Execution always.</b></p>
        <div className="intro-line" />
        <span>Based in Kottayam, Kerala</span>
      </section>

      <section className="about page-shell section" id="about">
        <div className="section-label"><span>01</span> About</div>
        <div className="about-grid">
          <div>
            <h2>Making complex offers easier to find, understand, and choose.</h2>
          </div>
          <div className="about-copy">
            <p>
              I bring a hands-on approach to digital marketing: researching search intent,
              creating clear content, reading performance data, and turning the learning into
              a stronger next campaign.
            </p>
            <p>
              Currently at <b>Consed International</b>, I support digital marketing work in a
              specialist healthcare space. My earlier experience spans marketing, social content,
              and client-facing business operations.
            </p>
            <a className="text-link" href="#contact">More about my approach <span>→</span></a>
          </div>
        </div>
        <div className="stat-grid">
          <article><strong>03</strong><span>marketing roles</span></article>
          <article><strong>09</strong><span>core marketing skills</span></article>
          <article><strong>06</strong><span>professional certifications</span></article>
          <article><strong>03</strong><span>working languages</span></article>
        </div>
      </section>

      <section className="work section" id="work">
        <div className="page-shell">
          <div className="work-heading">
            <div className="section-label"><span>02</span> Selected work</div>
            <p>Projects grounded in real briefs, search intent, and useful communication.</p>
          </div>
          <div className="work-controls">
            <div className="filter-row" aria-label="Filter portfolio projects">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={activeFilter === filter ? "filter active" : "filter"}
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={activeFilter === filter}
                >
                  {filter}
                </button>
              ))}
            </div>
            {isOwner && (
              <button className="add-work-button" type="button" onClick={studioOpen ? closeWorkStudio : openNewWorkStudio} aria-expanded={studioOpen} aria-controls="work-studio">
                {studioOpen ? "Close studio" : "Add your work"} <span>+</span>
              </button>
            )}
          </div>
          {isOwner && studioOpen && (
            <form className="work-studio" id="work-studio" onSubmit={handleAddWork}>
              <div className="studio-heading">
                <div><span>Portfolio studio</span><h3>{editingProjectId ? "Update your work details." : "Add a photo and your edited-video link."}</h3></div>
                <p>Your added work is saved privately in this browser until a full CMS is connected.</p>
              </div>
              <div className="studio-grid">
                <label className="studio-upload">
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                  {draftPhoto ? <img src={draftPhoto} alt="Selected work preview" /> : <><b>Upload cover photo</b><span>JPG, PNG, or WebP</span></>}
                </label>
                <div className="studio-fields">
                  <label>Project title<input required value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="e.g. Restaurant reel campaign" /></label>
                  <label>Client or brand<input value={draftClient} onChange={(event) => setDraftClient(event.target.value)} placeholder="e.g. Personal work" /></label>
                  <label className="studio-wide">Edited video link<input required type="url" value={draftVideoUrl} onChange={(event) => setDraftVideoUrl(event.target.value)} placeholder="https://youtube.com/... or Instagram/Vimeo/Drive link" /></label>
                  <label className="studio-wide">Short description<textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} placeholder="What was the idea, edit, or result?" rows={3} /></label>
                </div>
              </div>
              <div className="studio-footer">
                <span>{studioError || "Your image and video link stay on this device until you publish with a CMS."}</span>
                <button className="button button-primary" type="submit">{editingProjectId ? "Save changes" : "Add to portfolio"} <span>→</span></button>
              </div>
            </form>
          )}
          <div className="project-grid">
            {visibleProjects.map((project, index) => (
              <article className={`project-card ${project.className}`} key={project.title}>
                <div className="project-art">
                  {project.image && <img className="project-uploaded-image" src={project.image} alt={project.title + " work preview"} />}
                  <span className="project-index">0{index + 1}</span>
                  <div className="art-mark">{project.category === "SEO" ? "↗" : "Aa"}</div>
                  <span className="project-category">{project.category}</span>
                </div>
                <div className="project-info">
                  <div><p>{project.client} <i>•</i> {project.year}</p><h3>{project.title}</h3></div>
                  {project.videoUrl ? (
                    <a
                      className="circle-button"
                      href={project.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${project.title} video in a new tab`}
                    >
                      ↗
                    </a>
                  ) : (
                    <button
                      className="circle-button"
                      type="button"
                      disabled
                      aria-label={`A video link has not been added for ${project.title}`}
                      title="Add a video link to activate this button"
                    >
                      ↗
                    </button>
                  )}
                </div>
                <p className="project-copy">{project.copy}</p>
                <div className="project-result"><span>Outcome</span><b>{project.result}</b></div>
                {project.videoUrl && <a className="video-link" href={project.videoUrl} target="_blank" rel="noreferrer">Watch edited video <span>↗</span></a>}
                {isOwner && project.id && (
                  <div className="project-manage" aria-label={`Manage ${project.title}`}>
                    <button type="button" onClick={() => handleEditWork(project)}>Edit</button>
                    <button className="delete-work" type="button" onClick={() => handleDeleteWork(project.id!)}>Delete</button>
                  </div>
                )}
              </article>
            ))}
          </div>
          <a className="button button-outline" href="#contact">Discuss a project <span>→</span></a>
        </div>
      </section>

      <section className="skills page-shell section" id="skills">
        <div className="section-label"><span>03</span> Expertise</div>
        <div className="skills-head"><h2>A practical marketing toolkit, kept close to the work.</h2><p>From research and SEO to creative production and reporting, every capability supports a more coherent customer journey.</p></div>
        <div className="skills-grid">
          {skills.map((skill, index) => (
            <article className="skill-card" key={skill.name}>
              <span className="skill-number">0{index + 1}</span>
              <div><p>{skill.tag}</p><h3>{skill.name}</h3></div>
              <span className="skill-level">{skill.level}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="timeline section">
        <div className="page-shell timeline-shell">
          <div className="timeline-lead"><div className="section-label"><span>04</span> Experience</div><h2>Curious by nature. <em>Grounded</em> in practice.</h2></div>
          <div className="timeline-list">
            <article>
              <span className="timeline-date">2025 - Present</span>
              <div><p>Digital Marketing Executive</p><h3>Consed International</h3></div>
              <span className="timeline-detail">SEO • Content • Social</span>
            </article>
            <article>
              <span className="timeline-date">2024</span>
              <div><p>Digital Marketing Intern</p><h3>Letmac Innovations</h3></div>
              <span className="timeline-detail">Social • Creative • Analytics</span>
            </article>
            <article>
              <span className="timeline-date">2022 - 2023</span>
              <div><p>Marketing Executive</p><h3>Naza Enterprises</h3></div>
              <span className="timeline-detail">Content • Search • Growth</span>
            </article>
            <article>
              <span className="timeline-date">2017 - 2019</span>
              <div><p>Service Advisor</p><h3>Purackel Honda, Kottayam</h3></div>
              <span className="timeline-detail">Customer experience</span>
            </article>
          </div>
        </div>
      </section>

      <section className="certs page-shell section">
        <div className="certs-layout">
          <div><div className="section-label"><span>05</span> Learning</div><h2>Always sharpening the toolkit.</h2><p>Formal learning in inbound marketing, sales, social media, and Google Analytics complements hands-on campaign work.</p></div>
          <div className="cert-list">
            {certifications.map((certificate, index) => <div key={certificate}><span>0{index + 1}</span><p>{certificate}</p><b>↗</b></div>)}
          </div>
        </div>
      </section>

      <section className="dashboard-tease page-shell">
        <div className="dashboard-copy"><span className="eyebrow"><i /> Project management space</span><h2>Built to keep the work <em>visible.</em></h2><p>A considered system for projects, published work, learning milestones, and campaign insight.</p><a href="#contact" className="text-link">Request a project walkthrough <span>→</span></a></div>
        <div className="dashboard-window" aria-label="Portfolio dashboard preview">
          <div className="dash-top"><span /><span /><span /><b>anandphilip.in / workspace</b></div>
          <div className="dash-main"><aside><strong>AP</strong><span className="aside-active" /><span /><span /><span /></aside><div className="dash-content"><div className="dash-title"><div><p>Overview</p><h3>Good morning, Anand.</h3></div><button>+ Add project</button></div><div className="dash-stats"><div><span>Published work</span><b>12</b><i /></div><div><span>Search visibility</span><b>+28%</b><i /></div><div><span>New inquiries</span><b>08</b><i /></div></div><div className="dash-chart"><div><p>Project momentum</p><span>Last 6 months</span></div><div className="chart-lines"><i /><i /><i /><i /><i /><svg viewBox="0 0 360 100" role="img" aria-label="A rising performance trend"><polyline points="0,82 50,68 100,73 150,43 210,56 264,26 310,35 360,8" fill="none" stroke="currentColor" strokeWidth="3" /></svg></div></div></div></div>
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="page-shell contact-shell">
          <div className="section-label"><span>06</span> Contact</div>
          <div className="contact-grid"><div><p className="contact-kicker">Have a project in mind?</p><h2>Let&apos;s make your next move <em>count.</em></h2></div><div className="contact-actions"><a href="mailto:anandphilip02@gmail.com" className="email-link">anandphilip02@gmail.com <span>↗</span></a><div className="contact-meta"><a href="tel:+919961336265">+91 99613 36265</a><span>Kottayam, Kerala, India</span></div><div className="social-row"><a href="https://wa.me/919961336265" target="_blank" rel="noreferrer">WhatsApp</a><a href="mailto:anandphilip02@gmail.com">Email</a><a href={resumeUrl} download>Resume</a></div></div></div>
        </div>
      </section>

      <footer className="footer page-shell"><a className="brand" href="#top"><span>AP</span><small>Digital marketing</small></a><p>© 2026 Anand Philip. Crafted with purpose.</p>{ownerLoginEnabled && <button className="owner-access" type="button" onClick={isOwner ? handleOwnerLogout : () => setOwnerLoginOpen(true)}>{isOwner ? "Sign out" : "Owner access"}</button>}<a href="#top">Back to top ↑</a></footer>
    </main>
  );
}
