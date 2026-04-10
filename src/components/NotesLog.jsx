import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";

async function downloadFile(signedUrl, filename) {
  try {
    const res = await fetch(signedUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // silently ignore — signed URL may have expired
  }
}
import { supabase } from "../lib/supabase";

const BUCKET = "note-attachments";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const SIGNED_URL_EXPIRY = 3600; // 1 hour

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif",
  "video/mp4", "video/quicktime",
]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".mp4", ".mov"]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function isImage(type) { return !!type?.startsWith("image/"); }
function isVideo(type) { return !!type?.startsWith("video/"); }

function isHeicFile(file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  return (
    file.type === "image/heic" || file.type === "image/heif" ||
    ext === ".heic" || ext === ".heif"
  );
}

async function convertHeicToJpeg(file) {
  const { default: heic2any } = await import("heic2any");
  const resultBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  const blob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], newName, { type: "image/jpeg" });
}

async function compressImage(file, maxDim = 1920, quality = 0.8) {
  if (file.size < 200 * 1024) return file; // skip if already small
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
          } else {
            resolve(file); // compressed is bigger — keep original
          }
        },
        "image/jpeg",
        quality,
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); resolve(file); };
    img.src = URL.createObjectURL(file);
  });
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function validateFile(file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_MIME.has(file.type) && !ALLOWED_EXT.has(ext)) {
    return `"${file.name}" is not a supported file type. Allowed: JPG, PNG, HEIC, MP4, MOV.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" exceeds the 50 MB file size limit.`;
  }
  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClipIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function PendingThumb({ entry, progress, disabled, onRemove }) {
  return (
    <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
      {entry.previewUrl ? (
        <img src={entry.previewUrl} alt={entry.name}
          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border)", display: "block" }} />
      ) : (
        <div style={{
          width: 64, height: 64, borderRadius: 4, border: "1px solid var(--border)",
          background: "var(--surface)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 9, color: "var(--muted)",
          textAlign: "center", padding: 4, boxSizing: "border-box",
        }}>
          {entry.name.split(".").pop().toUpperCase()}
        </div>
      )}
      {/* Upload progress bar */}
      {progress != null && progress < 100 && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 4, background: "rgba(0,0,0,0.45)", borderRadius: "0 0 4px 4px",
        }}>
          <div style={{
            height: "100%", background: "var(--accent)", borderRadius: "0 0 4px 4px",
            width: `${progress}%`, transition: "width 0.15s",
          }} />
        </div>
      )}
      {/* Uploading spinner overlay */}
      {progress != null && progress < 100 && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)",
          borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 9, color: "#fff" }}>{progress}%</span>
        </div>
      )}
      {!disabled && (
        <button onClick={() => onRemove(entry.id)} title="Remove"
          style={{
            position: "absolute", top: -6, right: -6, width: 16, height: 16,
            borderRadius: "50%", background: "#ef4444", border: "none",
            cursor: "pointer", color: "#fff", fontSize: 11, padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, zIndex: 1,
          }}>×</button>
      )}
    </div>
  );
}

function AttachmentInline({ att, signedUrl, onImageClick }) {
  const [hovered, setHovered] = useState(false);
  const longPressTimer = useRef(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      if (signedUrl) downloadFile(signedUrl, att.filename);
    }, 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  if (att._uploading) {
    return (
      <div style={{
        width: 64, height: 64, borderRadius: 4, border: "1px solid var(--border)",
        background: "var(--surface)", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 9, color: "var(--muted)",
        textAlign: "center", padding: 4, boxSizing: "border-box", position: "relative",
      }}>
        <span>Uploading…</span>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
          background: "var(--border)", borderRadius: "0 0 4px 4px", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", background: "var(--accent)", borderRadius: "0 0 4px 4px",
            width: "60%", animation: "pulse 1.5s ease-in-out infinite",
          }} />
        </div>
      </div>
    );
  }
  if (!signedUrl) {
    return (
      <div style={{
        fontSize: 10, color: "var(--dim)", padding: "3px 8px",
        background: "var(--surface)", borderRadius: 4, border: "1px solid var(--border)",
      }}>
        {att.filename} (loading…)
      </div>
    );
  }
  if (isVideo(att.type)) {
    return (
      <video src={signedUrl} controls
        style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 4, border: "1px solid var(--border)", display: "block" }} />
    );
  }
  if (isImage(att.type)) {
    return (
      <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <img src={signedUrl} alt={att.filename} onClick={() => onImageClick(signedUrl)}
          style={{ width: 240, height: 240, objectFit: "cover", borderRadius: 4, cursor: "pointer", border: "1px solid var(--border)", display: "block" }} />
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); downloadFile(signedUrl, att.filename); }}
            title={`Download ${att.filename}`}
            style={{
              position: "absolute", bottom: 4, right: 4,
              background: "rgba(0,0,0,0.65)", border: "none", borderRadius: 3,
              cursor: "pointer", padding: "3px 5px", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        )}
      </div>
    );
  }
  return null;
}

// ── Background upload queue (survives component unmount) ─────────────────────

const bgQueue = new Map(); // noteId → Promise

async function bgUploadAndPatch(supabaseClient, bucket, srId, noteId, files) {
  const results = [];
  for (const entry of files) {
    const path = `notes/${srId}/${noteId}/${entry.name}`;
    const { error } = await supabaseClient.storage.from(bucket).upload(path, entry.file, {
      cacheControl: "3600", upsert: false,
    });
    if (!error) results.push({ path, filename: entry.name, type: entry.type, size: entry.file.size });
  }
  if (results.length > 0) {
    await supabaseClient.from("sr_notes").update({ attachments: results }).eq("id", noteId);
  }
  bgQueue.delete(noteId);
  // Clean up preview URLs
  files.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
  return results;
}

// ── Main component ────────────────────────────────────────────────────────────

const NotesLog = forwardRef(function NotesLog({ srId, currentUserName, isAdmin, canSetClientVisible = false, onPendingFilesChange }, ref) {
  const [notes,            setNotes]            = useState([]);
  const [myUserId,         setMyUserId]         = useState(null);

  // New-note input
  const [input,            setInput]            = useState("");
  const [clientVisible,    setClientVisible]    = useState(false);
  const [pendingFiles,     setPendingFiles]     = useState([]);  // { id, file, name, previewUrl, type }
  const [fileError,        setFileError]        = useState("");
  const [submitting,       setSubmitting]       = useState(false);
  const [uploadProgress,   setUploadProgress]   = useState({});  // { [fileId]: 0-100 }

  // Notify parent when pending files change
  useEffect(() => {
    onPendingFilesChange?.(pendingFiles.length);
  }, [pendingFiles.length, onPendingFilesChange]);

  // Expose submit to parent (for "Send and Close" guard)
  const handleSubmitRef = useRef(null);

  // Edit state
  const [editingId,        setEditingId]        = useState(null);
  const [editBody,         setEditBody]         = useState("");
  const [editClientVisible, setEditClientVisible] = useState(false);
  const [editPendingFiles, setEditPendingFiles] = useState([]);
  const [editRemovedPaths, setEditRemovedPaths] = useState([]);
  const [editFileError,    setEditFileError]    = useState("");
  const [editSaving,       setEditSaving]       = useState(false);

  // Delete state
  const [deleteConfirmId,  setDeleteConfirmId]  = useState(null);
  const [deleting,         setDeleting]         = useState(false);

  // Signed URL cache  { [storagePath]: signedUrl }
  const [signedUrls,       setSignedUrls]       = useState({});

  // Lightbox
  const [lightboxUrl,      setLightboxUrl]      = useState(null);

  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);
  const editFileRef  = useRef(null);

  // Load session user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setMyUserId(session?.user?.id ?? null);
    });
  }, []);

  // Load notes
  useEffect(() => {
    if (!srId) return;
    supabase
      .from("sr_notes")
      .select("*")
      .eq("sr_id", srId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const loaded = data || [];
        setNotes(loaded);
        refreshSignedUrls(loaded);
      });
  }, [srId]);

  // Scroll to bottom on new notes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  // Lightbox keyboard close
  useEffect(() => {
    if (!lightboxUrl) return;
    const handler = (e) => { if (e.key === "Escape") setLightboxUrl(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxUrl]);

  // ── Signed URLs ─────────────────────────────────────────────────────────────

  const refreshSignedUrls = useCallback(async (notesList) => {
    const paths = [];
    for (const note of notesList) {
      for (const att of (note.attachments || [])) {
        if (att.path) paths.push(att.path);
      }
    }
    if (!paths.length) return;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_EXPIRY);

    if (!error && data) {
      const map = {};
      data.forEach((item, i) => {
        const path = item.path || paths[i];
        if (item.signedUrl && path) map[path] = item.signedUrl;
      });
      setSignedUrls(prev => ({ ...prev, ...map }));
    }
  }, []);

  if (!srId) return null;

  // ── File selection & validation ──────────────────────────────────────────────

  const buildEntry = async (file) => {
    let f = file;
    if (isHeicFile(file)) {
      try { f = await convertHeicToJpeg(file); } catch { /* use original on failure */ }
    }
    if (isImage(f.type)) {
      try { f = await compressImage(f); } catch { /* use uncompressed on failure */ }
    }
    const previewUrl = isImage(f.type) ? URL.createObjectURL(f) : null;
    return { id: uid(), file: f, name: f.name, previewUrl, type: f.type };
  };

  const handleFileSelect = async (files, forEdit = false) => {
    const arr = Array.from(files);
    const errors = arr.map(validateFile).filter(Boolean);
    if (errors.length) {
      forEdit ? setEditFileError(errors[0]) : setFileError(errors[0]);
      return;
    }
    forEdit ? setEditFileError("") : setFileError("");
    const entries = await Promise.all(arr.map(buildEntry));
    forEdit
      ? setEditPendingFiles(prev => [...prev, ...entries])
      : setPendingFiles(prev => [...prev, ...entries]);
  };

  const removePending = (id, forEdit = false) => {
    if (forEdit) {
      setEditPendingFiles(prev => {
        const entry = prev.find(f => f.id === id);
        if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
        return prev.filter(f => f.id !== id);
      });
    } else {
      setPendingFiles(prev => {
        const entry = prev.find(f => f.id === id);
        if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
        return prev.filter(f => f.id !== id);
      });
    }
  };

  // ── Upload helpers ───────────────────────────────────────────────────────────

  const uploadFiles = async (files, noteId) => {
    const results = [];
    for (const entry of files) {
      const path = `notes/${srId}/${noteId}/${entry.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, entry.file, {
        cacheControl: "3600",
        upsert: false,
        onUploadProgress: (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [entry.id]: Math.round((progress.loaded / progress.total) * 100),
          }));
        },
      });
      if (!error) {
        results.push({ path, filename: entry.name, type: entry.type, size: entry.file.size });
      }
    }
    return results;
  };

  const deleteStorageFiles = async (paths) => {
    if (!paths?.length) return;
    await supabase.functions.invoke("delete-note-attachments", { body: { paths } });
  };

  // ── Submit new note ──────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const body = input.trim();
    if ((!body && pendingFiles.length === 0) || submitting || !myUserId) return;

    setSubmitting(true);
    setUploadProgress({});

    const filesToUpload = [...pendingFiles];
    const hasFiles = filesToUpload.length > 0;

    // Insert note row immediately (photos upload in background)
    const { data: note, error: insertErr } = await supabase
      .from("sr_notes")
      .insert({
        sr_id:       srId,
        author_id:   myUserId,
        author_name: currentUserName || "Unknown",
        body:        body || null,
        attachments: [],
        client_visible: clientVisible,
      })
      .select()
      .single();

    if (insertErr || !note) {
      setSubmitting(false);
      return;
    }

    // Clear input immediately — note is saved
    setInput("");
    setClientVisible(false);
    setPendingFiles([]);
    setUploadProgress({});

    // Show note in the list right away (with uploading placeholder if files pending)
    const placeholderAtts = hasFiles
      ? filesToUpload.map(f => ({ path: null, filename: f.name, type: f.type, _uploading: true }))
      : [];
    setNotes(prev => [...prev, { ...note, attachments: placeholderAtts }]);
    setSubmitting(false);

    // Upload files in background (survives component unmount)
    if (hasFiles) {
      const uploadPromise = bgUploadAndPatch(supabase, BUCKET, srId, note.id, filesToUpload)
        .then(attachments => {
          // If component is still mounted, update the note in-place
          setNotes(prev => prev.map(n =>
            n.id === note.id ? { ...n, attachments: attachments.length > 0 ? attachments : [] } : n
          ));
          if (attachments.length > 0) refreshSignedUrls([{ attachments }]);
        })
        .catch(() => {
          // Upload failed — note text is already saved; remove uploading placeholders
          setNotes(prev => prev.map(n =>
            n.id === note.id ? { ...n, attachments: [] } : n
          ));
        });
      bgQueue.set(note.id, uploadPromise);
    }
  };

  handleSubmitRef.current = handleSubmit;
  useImperativeHandle(ref, () => ({ submit: () => handleSubmitRef.current?.() }), []);

  // ── Edit ─────────────────────────────────────────────────────────────────────

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditBody(note.body || "");
    setEditClientVisible(note.client_visible || false);
    setEditPendingFiles([]);
    setEditRemovedPaths([]);
    setEditFileError("");
    setDeleteConfirmId(null);
  };

  const cancelEdit = () => {
    editPendingFiles.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    setEditingId(null);
    setEditBody("");
    setEditPendingFiles([]);
    setEditRemovedPaths([]);
    setEditFileError("");
    setUploadProgress({});
  };

  const handleEditSave = async (note) => {
    const body = editBody.trim();
    const keptAttachments = (note.attachments || []).filter(a => !editRemovedPaths.includes(a.path));
    if (!body && keptAttachments.length === 0 && editPendingFiles.length === 0) return;
    if (editSaving) return;

    setEditSaving(true);
    setUploadProgress({});

    // Upload newly attached files
    let newAttachments = [];
    if (editPendingFiles.length > 0) {
      newAttachments = await uploadFiles(editPendingFiles, note.id);
    }

    const finalAttachments = [...keptAttachments, ...newAttachments];

    const { data, error } = await supabase
      .from("sr_notes")
      .update({ body: body || null, edited_at: new Date().toISOString(), attachments: finalAttachments, client_visible: editClientVisible })
      .eq("id", note.id)
      .select()
      .single();

    // Delete removed files from storage
    if (editRemovedPaths.length > 0) {
      await deleteStorageFiles(editRemovedPaths);
      setSignedUrls(prev => {
        const next = { ...prev };
        editRemovedPaths.forEach(p => delete next[p]);
        return next;
      });
    }

    // Fetch signed URLs for new attachments
    if (newAttachments.length > 0) {
      await refreshSignedUrls([{ attachments: newAttachments }]);
    }

    editPendingFiles.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });

    setEditSaving(false);
    if (!error && data) {
      setNotes(prev => prev.map(n => n.id === note.id ? { ...data, attachments: finalAttachments } : n));
      setEditingId(null);
      setEditBody("");
      setEditPendingFiles([]);
      setEditRemovedPaths([]);
      setUploadProgress({});
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (note) => {
    setDeleting(true);
    const { error } = await supabase.from("sr_notes").delete().eq("id", note.id);
    if (!error) {
      const paths = (note.attachments || []).map(a => a.path).filter(Boolean);
      if (paths.length > 0) await deleteStorageFiles(paths);
      setNotes(prev => prev.filter(n => n.id !== note.id));
      setDeleteConfirmId(null);
    }
    setDeleting(false);
  };

  const isOwn    = (note) => note.author_id === myUserId;
  const canDelete = (note) => isOwn(note) || isAdmin;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Lightbox overlay */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "zoom-out",
        }}>
          <img src={lightboxUrl} alt="Full size" onClick={e => e.stopPropagation()} style={{
            maxWidth: "92vw", maxHeight: "90vh", borderRadius: 6,
            objectFit: "contain", cursor: "default",
          }} />
          <button onClick={() => setLightboxUrl(null)} style={{
            position: "absolute", top: 16, right: 20, background: "rgba(255,255,255,0.12)",
            border: "none", cursor: "pointer", color: "#fff", fontSize: 22,
            borderRadius: 4, padding: "2px 10px", lineHeight: 1,
          }}>×</button>
        </div>
      )}

      <div style={{ marginTop: 12, marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
          Notes Log
        </div>

        {/* Scrollable log */}
        <div style={{ background: "var(--plate)", border: "1px solid var(--border)", borderRadius: 5, maxHeight: 320, overflowY: "auto", padding: "6px 0" }}>
          {notes.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--dim)", textAlign: "center" }}>No notes yet.</div>
          ) : (
            notes.map(note => {
              const keptInEdit = (note.attachments || []).filter(a => !editRemovedPaths.includes(a.path));

              return (
                <div key={note.id} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--snow)" }}>{note.author_name}</span>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{fmt(note.created_at)}</span>
                    {note.edited_at && (
                      <span style={{ fontSize: 10, color: "var(--dim)", fontStyle: "italic" }}>
                        edited {fmt(note.edited_at)}
                      </span>
                    )}
                    {note.client_visible && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.22)",
                        borderRadius: 3, padding: "1px 6px",
                      }}>Client Visible</span>
                    )}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      {isOwn(note) && editingId !== note.id && (
                        <button onClick={() => startEdit(note)} style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: 10, color: "var(--muted)", padding: 0, fontFamily: "'Barlow',sans-serif",
                        }}>Edit</button>
                      )}
                      {canDelete(note) && deleteConfirmId !== note.id && editingId !== note.id && (
                        <button onClick={() => { setDeleteConfirmId(note.id); setEditingId(null); }} style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: 10, color: "rgba(239,68,68,0.7)", padding: 0, fontFamily: "'Barlow',sans-serif",
                        }}>Delete</button>
                      )}
                    </div>
                  </div>

                  {/* Edit mode */}
                  {editingId === note.id ? (
                    <div>
                      <textarea
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        placeholder="Note text (optional if attachments present)"
                        autoFocus
                        style={{ width: "100%", minHeight: 56, fontSize: 12, marginBottom: 6, boxSizing: "border-box" }}
                      />

                      {/* Existing attachments with remove button */}
                      {keptInEdit.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                          {keptInEdit.map(att => (
                            <div key={att.path} style={{ position: "relative", flexShrink: 0 }}>
                              {isImage(att.type) && signedUrls[att.path] ? (
                                <img src={signedUrls[att.path]} alt={att.filename} style={{
                                  width: 56, height: 56, objectFit: "cover", borderRadius: 4,
                                  border: "1px solid var(--border)", display: "block",
                                }} />
                              ) : isVideo(att.type) ? (
                                <div style={{
                                  width: 56, height: 56, borderRadius: 4, border: "1px solid var(--border)",
                                  background: "var(--surface)", display: "flex", alignItems: "center",
                                  justifyContent: "center", fontSize: 9, color: "var(--muted)",
                                }}>VIDEO</div>
                              ) : (
                                <div style={{
                                  width: 56, height: 56, borderRadius: 4, border: "1px solid var(--border)",
                                  background: "var(--surface)", display: "flex", alignItems: "center",
                                  justifyContent: "center", fontSize: 9, color: "var(--muted)",
                                }}>{att.filename?.split(".").pop()?.toUpperCase()}</div>
                              )}
                              <button onClick={() => setEditRemovedPaths(prev => [...prev, att.path])} title="Remove attachment"
                                style={{
                                  position: "absolute", top: -6, right: -6, width: 16, height: 16,
                                  borderRadius: "50%", background: "#ef4444", border: "none",
                                  cursor: "pointer", color: "#fff", fontSize: 11, padding: 0,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New files staged in edit */}
                      {editPendingFiles.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                          {editPendingFiles.map(entry => (
                            <PendingThumb key={entry.id} entry={entry}
                              progress={uploadProgress[entry.id]}
                              disabled={editSaving}
                              onRemove={id => removePending(id, true)} />
                          ))}
                        </div>
                      )}

                      {editFileError && (
                        <div style={{ fontSize: 11, color: "#fca5a5", marginBottom: 6 }}>{editFileError}</div>
                      )}

                      <input ref={editFileRef} type="file" multiple
                        accept="image/jpeg,image/png,image/heic,image/heif,video/mp4,video/quicktime,.heic,.heif,.jpg,.jpeg,.png,.mp4,.mov"
                        style={{ display: "none" }}
                        onChange={e => { handleFileSelect(e.target.files, true); e.target.value = ""; }} />

                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleEditSave(note)}
                          disabled={editSaving || (!editBody.trim() && keptInEdit.length === 0 && editPendingFiles.length === 0)}>
                          {editSaving ? "Saving…" : "Save"}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>
                        <button type="button" className="btn btn-ghost btn-sm"
                          onClick={() => { setEditFileError(""); editFileRef.current?.click(); }}
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                          title="Attach files (JPG, PNG, HEIC, MP4, MOV)">
                          <ClipIcon /> Attach
                        </button>
                        <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", marginLeft: "auto", fontSize: 11, color: editClientVisible ? "#60a5fa" : "var(--muted)", letterSpacing: 0 }}>
                          <input type="checkbox" checked={editClientVisible} onChange={e => setEditClientVisible(e.target.checked)}
                            style={{ width: 13, height: 13, accentColor: "#3b82f6", cursor: "pointer" }} />
                          Client Visible
                        </label>
                      </div>
                    </div>

                  /* Delete confirm */
                  ) : deleteConfirmId === note.id ? (
                    <div>
                      <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 6 }}>Delete this note? This cannot be undone.</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-sm" style={{ background: "#ef4444", color: "#fff" }}
                          onClick={() => handleDelete(note)} disabled={deleting}>
                          {deleting ? "Deleting…" : "Confirm Delete"}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                      </div>
                    </div>

                  /* Read mode */
                  ) : (
                    <div>
                      {note.body && (
                        <div style={{
                          fontSize: 12, color: "var(--body)", lineHeight: 1.55,
                          whiteSpace: "pre-wrap",
                          marginBottom: (note.attachments?.length > 0) ? 8 : 0,
                        }}>
                          {note.body}
                        </div>
                      )}
                      {note.attachments?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {note.attachments.map(att => (
                            <AttachmentInline key={att.path} att={att}
                              signedUrl={signedUrls[att.path]}
                              onImageClick={setLightboxUrl} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Hidden file input for new notes */}
        <input ref={fileInputRef} type="file" multiple
          accept="image/jpeg,image/png,image/heic,image/heif,video/mp4,video/quicktime,.heic,.heif,.jpg,.jpeg,.png,.mp4,.mov"
          style={{ display: "none" }}
          onChange={e => { handleFileSelect(e.target.files); e.target.value = ""; }} />

        {/* Pending file thumbnails */}
        {pendingFiles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {pendingFiles.map(entry => (
              <PendingThumb key={entry.id} entry={entry}
                progress={uploadProgress[entry.id]}
                disabled={submitting}
                onRemove={id => removePending(id, false)} />
            ))}
          </div>
        )}

        {fileError && (
          <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 6 }}>{fileError}</div>
        )}

        {/* Input row */}
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
            placeholder="Add a note… (Ctrl+Enter to submit)"
            style={{ flex: 1, minHeight: 56, height: 56, resize: "vertical", fontSize: 12, padding: "8px 10px", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignSelf: "flex-end" }}>
            <button type="button" className="btn btn-ghost btn-sm"
              onClick={() => { setFileError(""); fileInputRef.current?.click(); }}
              style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
              title="Attach files (JPG, PNG, HEIC, MP4, MOV)">
              <ClipIcon /> Attach
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleSubmit}
              disabled={submitting || (!input.trim() && pendingFiles.length === 0)}
              style={{ whiteSpace: "nowrap" }}>
              {submitting ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
        {canSetClientVisible && (
          <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", marginTop: 6, fontSize: 11, color: clientVisible ? "#60a5fa" : "var(--muted)" }}>
            <input type="checkbox" checked={clientVisible} onChange={e => setClientVisible(e.target.checked)}
              style={{ width: 13, height: 13, accentColor: "#3b82f6", cursor: "pointer" }} />
            Client Visible — note will be shown to the client on their portal
          </label>
        )}
      </div>
    </>
  );
});

export default NotesLog;
