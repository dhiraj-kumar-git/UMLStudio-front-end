import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useDiagramContext } from "../context/DiagramContext";
import { useProjectContext } from "../context/ProjectContext";
import * as api from "../api.config";
import "./HomePage.css";

export const HomePage: React.FC = () => {
  const { logout } = useAuthContext();
  const diagCtx = useDiagramContext();
  const projectCtx = useProjectContext();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const name = localStorage.getItem("username") || "Guest";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingProjects(true);
        const list = await api.getProjectList();
        if (!mounted) return;
        setProjects(list || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("HomePage: failed to load project list", err);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleNew = () => {
    // create a fresh, untitled session (not attached to any project)
    try {
      // ensure any open project context is cleared so the editor opens in a clean state
      try { projectCtx.clearProjectContext?.(); } catch {}
      diagCtx.createSession?.("New Diagram", { components: [], associations: [], type: "UseCaseDiagram" });
      navigate("/editor");
    } catch (err) {
      navigate("/editor");
    }
  };

  return (
    <div className="home-page-div" style={{ minHeight: "100vh", width:"100vw", background: "linear-gradient(180deg,#0b0f12,#0f1720)", color: "#e6eef8",   fontFamily: "Inter, sans-serif",
  display: "flex",  flexDirection: "column" }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>UMLTool</div>
          <div style={{ color: '#9fb6c9', fontSize:16 }}>Welcome back, <span style={{ color: '#fff', fontWeight: 700 }}>{name}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={handleNew} style={{ background: '#00e5ff', color: '#001317'}}>+ New</button>
          <button className='logout' onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main style={{ padding: 40 }}>
        <section style={{ display: 'block', gap: 28, alignItems: 'start' }}>
          <div style={{ padding: 28, borderRadius: 12, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)', minHeight: 260 }}>
            <h2 style={{ margin: 0, fontSize: 28, color: '#fff' }}>Your workspace</h2>
            <p style={{ color: '#a7c0cf', marginTop: 8 }}>Create diagrams fast. Your recent work will appear here.</p>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#7fb3c7' }}>All Projects</div>
                  <div>
                    <button onClick={async () => { setLoadingProjects(true); try { const list = await api.getProjectList(); setProjects(list || []); } catch { } finally { setLoadingProjects(false); } }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.03)', color: '#9fb6c9', padding: '6px 8px', borderRadius: 6 }}>Refresh</button>
                  </div>
                </div>
                <div style={{ padding: 18, borderRadius: 8, background: '#071018' }}>
                  {loadingProjects ? (
                    <div style={{ color: '#9fb6c9' }}>Loading projects…</div>
                  ) : projects.length === 0 ? (
                    <div style={{ color: '#fff', fontWeight: 700 }}>No projects found</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                      {projects.map((p: any, idx) => (
                        <div key={p.projectId ?? p.projectDetails?.id ?? idx} onClick={async () => {
                          try {
                            const projectJSON = p.projectDetails ?? p.projectDetails?.project ?? null;
                            if (projectJSON) {
                              try { projectCtx.setProjectFromJSON?.(projectJSON); } catch (e) { /* ignore */ }
                            } else {
                              // eslint-disable-next-line no-console
                              console.warn('HomePage: clicked project has no projectDetails to load', p);
                            }
                          } catch (err) {
                            // swallow
                          } finally {
                            navigate('/editor');
                          }
                        }} style={{ padding: 12, borderRadius: 8, background: '#0b2229', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{p.projectName}</div>
                            <div style={{ fontSize: 12, color: '#8fd8e7' }}>{p.accessPolicy}</div>
                          </div>
                          <div style={{ marginTop: 6, color: '#9fb6c9', fontSize: 13 }}>{p.projectDescription ?? ''}</div>
                          <div style={{ marginTop: 10, fontSize: 12, color: '#6eaeb8' }}>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ width: 200, padding: 18, borderRadius: 8, background: '#071018' }}>
                <div style={{ fontSize: 12, color: '#7fb3c7' }}>Tips</div>
                <ul style={{ marginTop: 8, color: '#a7c0cf', paddingLeft: 18 }}>
                  <li>Use the + button to create a new diagram</li>
                  <li>Drag components to reposition</li>
                </ul>
              </div>
            </div>
          </div>

          {/* full-width dashboard — quick actions removed per request */}
        </section>
      </main>
    </div>
  );
};

export default HomePage;
