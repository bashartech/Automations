"use client";

import { useState } from "react";
import Image from "next/image";

const projects = [
  {
    name: "Basic AI Chatbot",
    github: "https://github.com/bashartech/Global-AI-Learning-Platform",
    deployment: "https://global-ai-learning-platform.vercel.app/",
  },
  {
    name: "Email Automation",
    github: "https://github.com/bashartech/Automations/tree/main/EmailAutomation",
    deployment: null,
    note: "token required",
  },
  {
    name: "Resume Screener AI",
    github: "https://github.com/bashartech/Automations/tree/main/Resume%20Screener%20AI",
    deployment: "https://automations-r3k4.vercel.app/",
  },
  {
    name: "Watsapp_Automation",
    github: "https://github.com/bashartech/Automations/tree/main/Watsapp_Automation",
    deployment: null,
    note: "token required",
  },
  {
    name: "Multi Tool AI Agent",
    github: "https://github.com/bashartech/AI_Employee",
    deployment: "http://167.71.237.77:5000/",
  },
  {
    name: "Rag automation",
    github: "https://github.com/bashartech/Automations/tree/main/Rag%20automation",
    deployment: "https://automations-ocbr.vercel.app/", 
  },
];

function IconGitHub(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.112.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.303-5.467-1.334-5.467-5.932 0-1.31.47-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.045.138 3.004.404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.243 2.873.12 3.176.77.84 1.234 1.911 1.234 3.221 0 4.61-2.807 5.625-5.48 5.922.43.37.814 1.102.814 2.222 0 1.605-.014 2.898-.014 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.296 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function IconExternal(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={props.className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H21v7.5M21 3l-9 9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21H3V3h9" />
    </svg>
  );
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProject, setModalProject] = useState<string | null>(null);

  function showSensitiveModal(projectName: string) {
    setModalProject(projectName);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalProject(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 dark:from-[#050505] dark:to:black p-8">
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Projects & Deployments</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">Professional listing of GitHub repositories and deployment links.</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a href="/" className="px-4 py-2 rounded-md bg-zinc-900 text-white">Home</a>
            <a href="https://github.com/bashartech" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-md border border-zinc-200">GitHub</a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((p) => (
            <article key={p.name} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-[#0b0b0b] dark:border-zinc-800">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</h2>
                  {p.note && <p className="text-sm text-zinc-500 mt-1">{p.note}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <a href={p.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <IconGitHub className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">GitHub</span>
                  </a>
                  <a
                    href={p.deployment ?? '#'}
                    onClick={(e) => {
                      if (!p.deployment) {
                        e.preventDefault();
                        showSensitiveModal(p.name);
                      }
                    }}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 rounded px-3 py-2 ${p.deployment ? 'hover:bg-zinc-50 dark:hover:bg-zinc-900' : 'opacity-50 cursor-not-allowed'}`}
                    aria-disabled={!p.deployment}
                  >
                    <IconExternal className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Deployment</span>
                  </a>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a href={p.github} target="_blank" rel="noreferrer" className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                  {p.github}
                </a>
                {p.deployment ? (
                  <a href={p.deployment} target="_blank" rel="noreferrer" className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                    {p.deployment}
                  </a>
                ) : (
                  <span className="text-xs text-zinc-500">No deployment link provided</span>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg dark:bg-[#0b0b0b]">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Security notice — {modalProject}</h3>
            <p className="mt-3 text-zinc-700 dark:text-zinc-300">
              This project contains files with sensitive credentials (tokens/secrets). For security
              reasons, no public deployment is provided. To deploy safely, remove or securely store
              any credential or token files and follow the repository's deployment instructions.
            </p>
            <div className="mt-6 flex justify-end">
              <button onClick={closeModal} className="px-4 py-2 rounded-md bg-zinc-900 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
