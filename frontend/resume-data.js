/* ==========================================
   DIGITAL RESUME — CENTRAL DATA
   ==========================================
   All resume content lives here so it can be
   updated without touching the UI components.
   Only verified information from the project/
   resume is used. Missing items = configurable.
========================================== */
(function () {
  window.ResumeData = {
    personal: {
      name: "Ankit Kumar",
      title: "Full Stack Web Developer | Generative AI Developer",
      tagline: "Building polished interfaces and AI-enhanced product experiences.",
      summary:
        "Aspiring Full Stack Web Developer and Generative AI Developer focused on building responsive web experiences, reliable APIs, and AI-powered workflows. I’m learning frontend craft, backend systems, database design, and LLM integration while building practical digital products and automation ideas.",
      location: "India",
      objective: "Full Stack Web Developer",
      photo: "images/ankit-portrait.jpeg",
      email: "ANKITKUMAR.DATA39@GMAIL.COM",
      phone: "+91 92290 47285",
      resumePdf: "Ankit_Kumar_Resume.pdf"
    },

    education: [
      {
        degree: "B.Tech in Artificial Intelligence & Data Science",
        school: "Sengunthar Engineering College",
        location: "Tamil Nadu, India",
        period: "Sep 2023 – Jun 2027",
        detail: "CGPA: 7.77 / 10",
        note: "Building a strong foundation in AI, data science, analytics, and programming fundamentals."
      },
      {
        degree: "Higher Secondary Education (Class XII)",
        school: "Vaishali Higher Secondary School",
        location: "",
        period: "2023",
        detail: "",
        note: "Completed with a focus on mathematics, science, and problem-solving."
      },
      {
        degree: "Secondary Education (Class X)",
        school: "Vaishali Vidyalaya",
        location: "",
        period: "2021",
        detail: "",
        note: "Completed with a strong interest in technology and continuous learning."
      }
    ],

    skills: {
      programming: ["HTML5", "CSS3", "JavaScript", "Node.js"],
      frontend: ["Responsive UI", "CSS architecture", "User experience basics"],
      backend: ["Express.js", "REST APIs", "Authentication concepts", "Web app structure"],
      databases: ["PostgreSQL", "MySQL", "MongoDB"],
      ai: ["LLM APIs", "Prompt design", "RAG concepts", "AI workflow thinking"],
      tools: ["Git", "GitHub", "VS Code", "Deployment basics", "Postman"]
    },

    experience: [
      {
        role: "Learning-focused web developer",
        company: "Self-directed",
        location: "India",
        period: "Current",
        tools: "HTML, CSS, JavaScript, Node.js",
        points: [
          "Building hands-on projects focused on frontend polish, API integrations, and clean product UX.",
          "Learning how full stack applications connect interfaces, data storage, and user flows in practical product settings.",
          "Exploring AI-driven workflows, prompt-based tools, and automation to extend product value beyond basic interfaces."
        ]
      }
    ],

    projects: [],
    certifications: [],
    achievements: [],

    tools: {
      Frontend: ["HTML5", "CSS3", "JavaScript"],
      Backend: ["Node.js", "Express.js", "REST APIs"],
      Databases: ["PostgreSQL", "MySQL", "MongoDB"],
      AI: ["LLM APIs", "Prompt design", "RAG concepts"],
      Development: ["Git", "GitHub", "VS Code", "Deployment basics"]
    },

    social: {
      email: "ANKITKUMAR.DATA39@GMAIL.COM",
      github: "https://github.com/ankitbuilds-SEC",
      linkedin: "https://www.linkedin.com/in/ankit-kumar-b66067406"
    }
  };
})();
