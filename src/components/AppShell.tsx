"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Idea, IDEA_STATUSES, Project, Task } from "@/lib/types";
import { memberById } from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase";
import * as db from "@/lib/db";
import { Sidebar, NavItem } from "./Sidebar";
import { BoardPage } from "./BoardPage";
import { IdeasPage } from "./IdeasPage";
import { TeamPage } from "./TeamPage";
import { SettingsPage } from "./SettingsPage";
import { WhoAreYou } from "./WhoAreYou";
import { Avatar, Icon } from "./parts";

const USER_KEY = "studio-user";
const THEME_KEY = "studio-theme";
const NAME_KEY = "studio-name";

type PageId = "board" | "ideas" | "team" | "settings";

const NAV: NavItem[] = [
  { id: "board", label: "Board", icon: "grid" },
  { id: "ideas", label: "Ideas", icon: "bulb" },
  { id: "team", label: "Team", icon: "users" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function AppShell() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [page, setPage] = useState<PageId>("board");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [studioName, setStudioNameState] = useState("Studio");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  // local prefs
  useEffect(() => {
    setCurrentUserId(localStorage.getItem(USER_KEY));
    setIsDark(document.documentElement.classList.contains("dark"));
    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setStudioNameState(savedName);
    setReady(true);
  }, []);

  // load data from supabase
  useEffect(() => {
    if (!ready) return;
    if (!isSupabaseReady) {
      setLoadError("Database not configured.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [data, counts] = await Promise.all([
          db.fetchEverything(),
          db.fetchCommentCounts().catch(() => ({})),
        ]);
        if (cancelled) return;
        setProjects(data.projects);
        setTasks(data.tasks);
        setIdeas(data.ideas);
        setCommentCounts(counts);
        setCurrentProjectId(data.projects[0]?.id ?? "");
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  // live sync: apply changes from other teammates instantly
  useEffect(() => {
    if (!ready || !isSupabaseReady) return;
    const unsubscribe = db.subscribeAll({
      task: (e) => {
        if (e.type === "DELETE") setTasks((p) => p.filter((t) => t.id !== e.id));
        else if (e.type === "INSERT")
          setTasks((p) => (p.some((t) => t.id === e.row.id) ? p : [e.row, ...p]));
        else setTasks((p) => p.map((t) => (t.id === e.row.id ? e.row : t)));
      },
      idea: (e) => {
        if (e.type === "DELETE") setIdeas((p) => p.filter((i) => i.id !== e.id));
        else if (e.type === "INSERT")
          setIdeas((p) => (p.some((i) => i.id === e.row.id) ? p : [e.row, ...p]));
        else setIdeas((p) => p.map((i) => (i.id === e.row.id ? e.row : i)));
      },
      project: (e) => {
        if (e.type === "DELETE") setProjects((p) => p.filter((x) => x.id !== e.id));
        else if (e.type === "INSERT")
          setProjects((p) => (p.some((x) => x.id === e.row.id) ? p : [...p, e.row]));
        else setProjects((p) => p.map((x) => (x.id === e.row.id ? e.row : x)));
      },
      comment: () => {
        db.fetchCommentCounts()
          .then(setCommentCounts)
          .catch(console.error);
      },
    });
    return unsubscribe;
  }, [ready]);

  const currentUser = currentUserId ? memberById(currentUserId) : undefined;

  /* ---------- prefs handlers ---------- */
  function pickUser(id: string) {
    localStorage.setItem(USER_KEY, id);
    setCurrentUserId(id);
  }
  function switchUser() {
    localStorage.removeItem(USER_KEY);
    setCurrentUserId(null);
  }
  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }
  function setStudioName(name: string) {
    setStudioNameState(name);
    localStorage.setItem(NAME_KEY, name);
  }
  function navigate(id: string) {
    setPage(id as PageId);
    setDrawerOpen(false);
  }

  /* ---------- task handlers (db-backed) ---------- */
  async function handleCreateTask(draft: {
    projectId: string;
    title: string;
    description?: string;
    priority: Task["priority"];
    assigneeIds: string[];
    dueDate?: string;
    imageUrls?: string[];
  }) {
    const task = await db.createTask({ ...draft, createdBy: currentUserId });
    setTasks((prev) => [task, ...prev]);
  }
  async function handleMoveTask(id: string, status: Task["status"]) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await db.updateTaskStatus(id, status);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleClaimTask(id: string) {
    if (!currentUserId) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, assigneeIds: [currentUserId] } : t))
    );
    try {
      await db.updateTaskAssignees(id, [currentUserId]);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await db.deleteTask(id);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleUpdateTask(
    id: string,
    fields: {
      title?: string;
      description?: string | null;
      priority?: Task["priority"];
      dueDate?: string | null;
      assigneeIds?: string[];
      status?: Task["status"];
    }
  ) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t };
        if (fields.title !== undefined) next.title = fields.title;
        if ("description" in fields) next.description = fields.description ?? undefined;
        if (fields.priority !== undefined) next.priority = fields.priority;
        if ("dueDate" in fields) next.dueDate = fields.dueDate ?? undefined;
        if (fields.assigneeIds !== undefined) next.assigneeIds = fields.assigneeIds;
        if (fields.status !== undefined) next.status = fields.status;
        return next;
      })
    );
    try {
      await db.updateTask(id, fields);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleAddProject() {
    const p = await db.createProject(`Project ${projects.length + 1}`);
    setProjects((prev) => [...prev, p]);
    setCurrentProjectId(p.id);
  }
  async function handleRenameProject(id: string, name: string) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    try {
      await db.updateProject(id, name);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleDeleteProject(id: string) {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (id === currentProjectId) setCurrentProjectId(remaining[0]?.id ?? "");
      return remaining;
    });
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    try {
      await db.deleteProject(id);
    } catch (e) {
      console.error(e);
    }
  }

  /* ---------- idea handlers (db-backed) ---------- */
  async function handleAddIdea(title: string, pitch?: string) {
    if (!currentUserId) return;
    const idea = await db.createIdea({ title, pitch, suggestedById: currentUserId });
    setIdeas((prev) => [idea, ...prev]);
  }
  async function handleToggleVote(id: string) {
    if (!currentUserId) return;
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    const votes = idea.votes.includes(currentUserId)
      ? idea.votes.filter((v) => v !== currentUserId)
      : [...idea.votes, currentUserId];
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, votes } : i)));
    try {
      await db.updateIdeaVotes(id, votes);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleCycleStatus(id: string) {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    const order = IDEA_STATUSES.map((x) => x.id);
    const next = order[(order.indexOf(idea.status) + 1) % order.length];
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status: next } : i)));
    try {
      await db.updateIdeaStatus(id, next);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleDeleteIdea(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    try {
      await db.deleteIdea(id);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleConvertToProject(idea: Idea) {
    const p = await db.createProject(idea.title);
    setProjects((prev) => [...prev, p]);
    setIdeas((prev) =>
      prev.map((i) => (i.id === idea.id ? { ...i, status: "building" as const } : i))
    );
    db.updateIdeaStatus(idea.id, "building").catch(console.error);
    setCurrentProjectId(p.id);
    setPage("board");
  }

  if (!ready) return null;
  if (!currentUserId) return <WhoAreYou onPick={pickUser} />;

  const sidebar = (
    <Sidebar
      studioName={studioName}
      items={NAV}
      active={page}
      onNavigate={navigate}
      currentUser={currentUser}
      isDark={isDark}
      onToggleTheme={toggleTheme}
      onSwitchUser={switchUser}
    />
  );

  return (
    <div className="min-h-dvh">
      {/* mobile top bar */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-ink"
        >
          <Icon name="menu" size={22} />
        </button>
        <span className="font-semibold text-ink">{studioName}</span>
        {currentUser && <Avatar member={currentUser} size={28} />}
      </div>

      <div className="flex">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-line sm:block">
          {sidebar}
        </aside>

        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-40 sm:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 bg-black/40"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "tween", duration: 0.2 }}
                className="absolute inset-y-0 left-0 w-64 border-r border-line shadow-xl"
              >
                {sidebar}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {loading ? (
              <div className="flex h-[60vh] items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading your workspace…</p>
              </div>
            ) : loadError ? (
              <div className="flex h-[60vh] items-center justify-center">
                <p className="max-w-sm text-center text-sm text-[var(--color-prio-urgent)]">
                  Couldn&apos;t reach the database: {loadError}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                {page === "board" && (
                  <BoardPage
                    tasks={tasks}
                    projects={projects}
                    currentProjectId={currentProjectId}
                    setCurrentProjectId={setCurrentProjectId}
                    currentUserId={currentUserId}
                    commentCounts={commentCounts}
                    onAddProject={handleAddProject}
                    onCreateTask={handleCreateTask}
                    onMoveTask={handleMoveTask}
                    onClaimTask={handleClaimTask}
                    onDeleteTask={handleDeleteTask}
                    onUpdateTask={handleUpdateTask}
                    onRenameProject={handleRenameProject}
                    onDeleteProject={handleDeleteProject}
                  />
                )}
                {page === "ideas" && (
                  <IdeasPage
                    ideas={ideas}
                    currentUserId={currentUserId}
                    onAddIdea={handleAddIdea}
                    onToggleVote={handleToggleVote}
                    onCycleStatus={handleCycleStatus}
                    onDeleteIdea={handleDeleteIdea}
                    onConvertToProject={handleConvertToProject}
                  />
                )}
                {page === "team" && <TeamPage tasks={tasks} />}
                {page === "settings" && (
                  <SettingsPage
                    studioName={studioName}
                    setStudioName={setStudioName}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                    projects={projects}
                  />
                )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
