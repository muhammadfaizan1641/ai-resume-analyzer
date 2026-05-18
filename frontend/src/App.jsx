import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  Upload,
  FileText,
  Briefcase,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Target,
  ChevronRight,
  Sparkles,
  BarChart3,
  Star,
  ArrowRight,
  RefreshCw,
  X,
} from "lucide-react";

const GLOBAL_STYLES = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  input::placeholder { color: #4a4a6a; }
  * { box-sizing: border-box; }

  .rai-header-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 16px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .rai-main { max-width: 1200px; margin: 0 auto; padding: 48px 32px; }
  .rai-hero { text-align: center; margin-bottom: 56px; }
  .rai-upload-wrap { max-width: 680px; margin: 0 auto; }
  .rai-stats { display: flex; gap: 12px; margin-top: 32px; }
  .rai-stat { flex: 1; text-align: center; padding: 16px 8px; background: #111118; border-radius: 16px; border: 1px solid #2a2a3e; }

  .rai-results-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 36px; flex-wrap: wrap; gap: 12px; }
  .rai-score-card { display: flex; flex-wrap: wrap; gap: 32px; align-items: center; justify-content: center; }
  .rai-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
  .rai-span2 { grid-column: span 2; }
  .rai-suggestions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }

  @media (max-width: 768px) {
    .rai-main { padding: 24px 16px; }
    .rai-hero { margin-bottom: 32px; }
    .rai-hero p { font-size: 15px !important; }
    .rai-powered { display: none; }
    .rai-upload-box { padding: 32px 20px !important; }
    .rai-grid { grid-template-columns: 1fr; }
    .rai-span2 { grid-column: span 1; }
    .rai-suggestions-grid { grid-template-columns: 1fr; }
    .rai-results-topbar h2 { font-size: 22px !important; }
    .rai-reset-label { display: none; }
    .rai-score-card { gap: 16px; }
    .rai-stats { gap: 8px; }
    .rai-stat { padding: 12px 4px; }
  }

  @media (max-width: 480px) {
    .rai-header-inner { padding: 12px 14px; }
    .rai-logo-text { font-size: 18px !important; }
    .rai-hero h1 { font-size: 30px !important; }
  }
`;

function ScoreRing({ score, size = 130, label, color = "#6c63ff" }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2a2a3e"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)",
          }}
        />
        <text
          x={size / 2}
          y={size / 2 + 6}
          textAnchor="middle"
          style={{
            transform: "rotate(90deg)",
            transformOrigin: `${size / 2}px ${size / 2}px`,
          }}
          fill={color}
          fontSize={size > 100 ? 26 : 16}
          fontWeight={800}
          fontFamily="Syne, sans-serif"
        >
          {score}
        </text>
      </svg>
      {label && (
        <span
          style={{
            fontSize: 11,
            color: "#7b7b9a",
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function Badge({ label, type = "found" }) {
  const colors = {
    found: {
      bg: "rgba(0,217,181,0.12)",
      border: "rgba(0,217,181,0.3)",
      text: "#00d9b5",
    },
    missing: {
      bg: "rgba(255,107,107,0.12)",
      border: "rgba(255,107,107,0.3)",
      text: "#ff6b6b",
    },
    keyword: {
      bg: "rgba(108,99,255,0.12)",
      border: "rgba(108,99,255,0.3)",
      text: "#6c63ff",
    },
  };
  const c = colors[type];
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        display: "inline-block",
        margin: "3px",
      }}
    >
      {label}
    </span>
  );
}

function SectionBar({ label, score }) {
  const color = score >= 75 ? "#00d9b5" : score >= 50 ? "#ffb347" : "#ff6b6b";
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, color: "#b0b0c8", fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>
          {score}/100
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "#2a2a3e",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: color,
            borderRadius: 3,
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );
}

function Card({ children, style = {}, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: "#111118",
        border: "1px solid #2a2a3e",
        borderRadius: 20,
        padding: 22,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ icon: Icon, title, color = "#6c63ff" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          background: `${color}22`,
          padding: 7,
          borderRadius: 9,
          flexShrink: 0,
        }}
      >
        <Icon size={15} color={color} />
      </div>
      <h3
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: "#e8e8f0",
        }}
      >
        {title}
      </h3>
    </div>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxFiles: 1,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const analyze = async () => {
    if (!file) return setError("Please upload a resume first.");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobRole", jobRole || "Software Engineer");
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/analyze`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setJobRole("");
  };
  const a = result?.analysis;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        position: "relative",
      }}
    >
      <style>{GLOBAL_STYLES}</style>
      <div className="noise-bg" />
      <div
        style={{
          position: "fixed",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse, rgba(108,99,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #2a2a3e",
          background: "rgba(10,10,15,0.8)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="rai-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6c63ff, #ff6b9d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={17} color="white" />
            </div>
            <span
              className="rai-logo-text"
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 20,
                fontWeight: 800,
                color: "#e8e8f0",
              }}
            >
              Resume<span style={{ color: "#6c63ff" }}>AI</span>
            </span>
          </div>
          <div
            className="rai-powered"
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              background: "rgba(108,99,255,0.12)",
              border: "1px solid rgba(108,99,255,0.3)",
              fontSize: 12,
              color: "#6c63ff",
              fontWeight: 500,
            }}
          >
            Powered by Gemini ✦
          </div>
        </div>
      </header>

      <main className="rai-main">
        {!result ? (
          <>
            {/* Hero */}
            <div className="rai-hero">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 16px",
                  borderRadius: 20,
                  marginBottom: 20,
                  background: "rgba(0,217,181,0.08)",
                  border: "1px solid rgba(0,217,181,0.2)",
                  fontSize: 12,
                  color: "#00d9b5",
                }}
              >
                <Zap size={12} /> AI-Powered Analysis in seconds
              </div>
              <h1
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: "clamp(30px, 6vw, 70px)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  marginBottom: 16,
                  background:
                    "linear-gradient(135deg, #e8e8f0 0%, #7b7b9a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Get your resume
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #6c63ff, #ff6b9d)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  scored instantly.
                </span>
              </h1>
              <p
                style={{
                  fontSize: 17,
                  color: "#7b7b9a",
                  maxWidth: 480,
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                Upload your resume, pick a job role, and get a detailed AI
                analysis with ATS score, strengths, gaps, and actionable fixes.
              </p>
            </div>

            {/* Upload */}
            <div className="rai-upload-wrap">
              <div
                {...getRootProps()}
                className="rai-upload-box"
                style={{
                  border: `2px dashed ${isDragActive || dragActive ? "#6c63ff" : file ? "#00d9b5" : "#2a2a3e"}`,
                  borderRadius: 22,
                  padding: "46px 28px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDragActive
                    ? "rgba(108,99,255,0.06)"
                    : file
                      ? "rgba(0,217,181,0.04)"
                      : "rgba(17,17,24,0.8)",
                  transition: "all 0.3s ease",
                  marginBottom: 14,
                }}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 14,
                        margin: "0 auto 12px",
                        background: "rgba(0,217,181,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText size={24} color="#00d9b5" />
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#00d9b5",
                        marginBottom: 4,
                        wordBreak: "break-all",
                        padding: "0 8px",
                      }}
                    >
                      {file.name}
                    </p>
                    <p style={{ fontSize: 12, color: "#7b7b9a" }}>
                      {(file.size / 1024).toFixed(1)} KB — Ready to analyze
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 15,
                        margin: "0 auto 16px",
                        background: "rgba(108,99,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(108,99,255,0.2)",
                      }}
                    >
                      <Upload size={24} color="#6c63ff" />
                    </div>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#e8e8f0",
                        marginBottom: 6,
                      }}
                    >
                      {isDragActive
                        ? "Drop it here!"
                        : "Drag & drop your resume"}
                    </p>
                    <p style={{ fontSize: 13, color: "#7b7b9a" }}>
                      or tap to browse · PDF or TXT
                    </p>
                  </div>
                )}
              </div>

              {/* Job Role */}
              <div style={{ marginBottom: 14, position: "relative" }}>
                <Briefcase
                  size={15}
                  color="#7b7b9a"
                  style={{
                    position: "absolute",
                    left: 15,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="Target Job Role (e.g. Full Stack Developer)"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "15px 15px 15px 42px",
                    background: "#111118",
                    border: "1px solid #2a2a3e",
                    borderRadius: 13,
                    color: "#e8e8f0",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#6c63ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a3e")}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: "11px 14px",
                    borderRadius: 11,
                    marginBottom: 12,
                    background: "rgba(255,107,107,0.1)",
                    border: "1px solid rgba(255,107,107,0.3)",
                    color: "#ff6b6b",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <AlertCircle
                    size={15}
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  {error}
                </div>
              )}

              <button
                onClick={analyze}
                disabled={loading || !file}
                style={{
                  width: "100%",
                  padding: "16px",
                  background:
                    loading || !file
                      ? "#2a2a3e"
                      : "linear-gradient(135deg, #6c63ff, #8b5cf6)",
                  border: "none",
                  borderRadius: 13,
                  cursor: loading || !file ? "not-allowed" : "pointer",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "Syne, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                  boxShadow:
                    !file || loading
                      ? "none"
                      : "0 8px 28px rgba(108,99,255,0.35)",
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw
                      size={17}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Analyzing with Gemini AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} /> Analyze Resume{" "}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {/* Stats */}
              <div className="rai-stats">
                {[
                  ["⚡", "3 sec", "Analysis Time"],
                  ["🎯", "95%", "Accuracy"],
                  ["📊", "10+", "Metrics"],
                ].map(([icon, val, lbl]) => (
                  <div key={lbl} className="rai-stat">
                    <div style={{ fontSize: 17, marginBottom: 3 }}>{icon}</div>
                    <div
                      style={{
                        fontFamily: "Syne",
                        fontWeight: 800,
                        fontSize: 16,
                        color: "#6c63ff",
                      }}
                    >
                      {val}
                    </div>
                    <div style={{ fontSize: 11, color: "#7b7b9a" }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            {/* Top bar */}
            <div className="rai-results-topbar">
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    fontFamily: "Syne",
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  Analysis Complete ✦
                </h2>
                <p
                  style={{
                    color: "#7b7b9a",
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Role:{" "}
                  <span style={{ color: "#6c63ff", fontWeight: 600 }}>
                    {result.jobRole}
                  </span>{" "}
                  · {file?.name}
                </p>
              </div>
              <button
                onClick={reset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 14px",
                  borderRadius: 11,
                  background: "#111118",
                  border: "1px solid #2a2a3e",
                  color: "#e8e8f0",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "DM Sans",
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                <X size={14} />{" "}
                <span className="rai-reset-label">New Analysis</span>
              </button>
            </div>

            {/* Scores */}
            <Card style={{ marginBottom: 18 }}>
              <div className="rai-score-card">
                <ScoreRing
                  score={a.overallScore}
                  label="Overall Score"
                  color="#6c63ff"
                  size={120}
                />
                <ScoreRing
                  score={a.atsScore}
                  label="ATS Score"
                  color="#00d9b5"
                  size={120}
                />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 12px",
                      borderRadius: 20,
                      marginBottom: 10,
                      background: "rgba(255,179,71,0.1)",
                      border: "1px solid rgba(255,179,71,0.3)",
                      color: "#ffb347",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <Award size={12} /> {a.experienceLevel}
                  </div>
                  <p
                    style={{ color: "#b0b0c8", fontSize: 13, lineHeight: 1.8 }}
                  >
                    {a.summary}
                  </p>
                </div>
              </div>
            </Card>

            {/* Cards grid */}
            <div className="rai-grid">
              <Card>
                <CardTitle
                  icon={CheckCircle}
                  title="Strengths"
                  color="#00d9b5"
                />
                {a.strengths.map((s, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 9, marginBottom: 11 }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        flexShrink: 0,
                        marginTop: 2,
                        background: "rgba(0,217,181,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChevronRight size={10} color="#00d9b5" />
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#b0b0c8",
                        lineHeight: 1.6,
                      }}
                    >
                      {s}
                    </p>
                  </div>
                ))}
              </Card>

              <Card>
                <CardTitle
                  icon={XCircle}
                  title="Areas to Improve"
                  color="#ff6b6b"
                />
                {a.weaknesses.map((w, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 9, marginBottom: 11 }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        flexShrink: 0,
                        marginTop: 2,
                        background: "rgba(255,107,107,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChevronRight size={10} color="#ff6b6b" />
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#b0b0c8",
                        lineHeight: 1.6,
                      }}
                    >
                      {w}
                    </p>
                  </div>
                ))}
              </Card>

              <Card className="rai-span2">
                <CardTitle
                  icon={Target}
                  title="Actionable Suggestions"
                  color="#6c63ff"
                />
                <div className="rai-suggestions-grid">
                  {a.suggestions.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 11,
                        background: "rgba(108,99,255,0.06)",
                        border: "1px solid rgba(108,99,255,0.15)",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          background: "rgba(108,99,255,0.2)",
                          color: "#6c63ff",
                          fontSize: 11,
                          fontWeight: 800,
                          fontFamily: "Syne",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#b0b0c8",
                          lineHeight: 1.6,
                        }}
                      >
                        {s}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardTitle
                  icon={BarChart3}
                  title="Section Scores"
                  color="#ff6b9d"
                />
                {Object.entries(a.sectionScores).map(([key, val]) => (
                  <SectionBar
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    score={val}
                  />
                ))}
              </Card>

              <Card>
                <CardTitle
                  icon={Star}
                  title="Skills Analysis"
                  color="#ffb347"
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "#7b7b9a",
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Found
                </p>
                <div style={{ marginBottom: 12 }}>
                  {a.skillsFound.map((s) => (
                    <Badge key={s} label={s} type="found" />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#7b7b9a",
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Missing
                </p>
                <div style={{ marginBottom: 12 }}>
                  {a.missingSkills.map((s) => (
                    <Badge key={s} label={s} type="missing" />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#7b7b9a",
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Keywords
                </p>
                <div>
                  {a.keywordsMatched.map((s) => (
                    <Badge key={s} label={s} type="keyword" />
                  ))}
                </div>
              </Card>

              <Card className="rai-span2">
                <CardTitle
                  icon={TrendingUp}
                  title="Format & Structure Feedback"
                  color="#00d9b5"
                />
                <p style={{ fontSize: 14, color: "#b0b0c8", lineHeight: 1.8 }}>
                  {a.formatFeedback}
                </p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
