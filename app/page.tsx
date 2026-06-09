"use client";

import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  InputAdornment,
  useMediaQuery,
  Collapse,
  Grid,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  LibraryBooks as DecksIcon,
  PlayArrow as StudyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon,
  Lightbulb as HintIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  ArrowBack as BackIcon,
  BarChart as StatsIcon,
  Whatshot as FireIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// ============================================================
// TYPES
// ============================================================

type FSRSState = "new" | "learning" | "review" | "relearning";
type Rating = 1 | 2 | 3 | 4;

interface FSRSCard {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: FSRSState;
  lastReview?: Date;
}

interface Flashcard {
  _id: string;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  deckId: string;
  fsrs: FSRSCard;
  createdAt: Date;
  updatedAt: Date;
}

interface Deck {
  _id: string;
  name: string;
  description?: string;
  cardCount: number;
  dueCount: number;
  newCount: number;
  createdAt: Date;
}

// ============================================================
// FSRS (simplified)
// ============================================================

const FSRS_W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

function initFSRS(): FSRSCard {
  return { due: new Date(), stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0, state: "new" };
}

function scheduleFSRS(card: FSRSCard, rating: Rating): FSRSCard {
  const now = new Date();
  const elapsed = card.lastReview ? Math.max(0, (now.getTime() - card.lastReview.getTime()) / 86400000) : 0;
  let c = { ...card, elapsedDays: elapsed, lastReview: now };

  if (card.state === "new") {
    c.stability = [1, 1.5, 2.5, 4][rating - 1];
    c.difficulty = Math.max(1, Math.min(10, 6 - (rating - 3) * 2));
    c.reps = 1;
    if (rating === 1) {
      c.state = "learning";
      c.scheduledDays = 0;
      c.due = new Date(now.getTime() + 10 * 60 * 1000);
    } else {
      c.state = "review";
      c.scheduledDays = Math.round(c.stability);
      c.due = new Date(now.getTime() + c.scheduledDays * 86400000);
    }
  } else if (card.state === "review") {
    c.reps += 1;
    if (rating === 1) {
      c.lapses += 1;
      c.state = "relearning";
      c.stability = Math.max(0.1, card.stability * 0.2);
      c.difficulty = Math.min(10, card.difficulty + 0.2);
      c.scheduledDays = 0;
      c.due = new Date(now.getTime() + 10 * 60 * 1000);
    } else {
      c.difficulty = Math.max(1, Math.min(10, card.difficulty + [-0.15, -0.07, 0, 0.1][rating - 1]));
      const R = Math.exp(Math.log(0.9) * elapsed / card.stability);
      c.stability = card.stability * (1 + Math.exp(FSRS_W[8]) * (11 - c.difficulty) * Math.pow(card.stability, -FSRS_W[9]) * (Math.exp((1 - R) * FSRS_W[10]) - 1)) * [0.8, 0.9, 1.1, 1.3][rating - 1];
      c.scheduledDays = Math.max(1, Math.min(36500, Math.round(c.stability * Math.log(0.9) / Math.log(0.9))));
      c.scheduledDays = Math.max(1, Math.round(c.stability));
      c.due = new Date(now.getTime() + c.scheduledDays * 86400000);
    }
  } else {
    if (rating >= 3) {
      c.state = "review";
      c.stability = Math.max(1, c.stability * 1.5);
      c.scheduledDays = Math.round(c.stability);
      c.due = new Date(now.getTime() + c.scheduledDays * 86400000);
    } else {
      c.due = new Date(now.getTime() + 10 * 60 * 1000);
    }
  }
  return c;
}

// Next-interval preview for rating buttons
function previewInterval(card: FSRSCard, rating: Rating): string {
  const next = scheduleFSRS(card, rating);
  if (next.scheduledDays === 0) return "< 10 mnt";
  if (next.scheduledDays === 1) return "1 hari";
  if (next.scheduledDays < 30) return `${next.scheduledDays} hari`;
  if (next.scheduledDays < 365) return `${Math.round(next.scheduledDays / 30)} bln`;
  return `${(next.scheduledDays / 365).toFixed(1)} thn`;
}

// ============================================================
// MOCK DATA
// ============================================================

const mkCard = (id: string, front: string, back: string, deckId: string, hint?: string, tags: string[] = []): Flashcard => ({
  _id: id, front, back, hint, tags, deckId, fsrs: initFSRS(), createdAt: new Date(), updatedAt: new Date(),
});

const mockDecks: Deck[] = [
  { _id: "d1", name: "Kosakata Bahasa Inggris", description: "1000 kata paling umum", cardCount: 48, dueCount: 12, newCount: 5, createdAt: new Date() },
  { _id: "d2", name: "Rumus Matematika", description: "Kalkulus & Aljabar", cardCount: 32, dueCount: 7, newCount: 3, createdAt: new Date() },
  { _id: "d3", name: "Sejarah Indonesia", description: "Dari kerajaan hingga kemerdekaan", cardCount: 60, dueCount: 20, newCount: 10, createdAt: new Date() },
  { _id: "d4", name: "Biologi Sel", description: "Struktur dan fungsi sel", cardCount: 25, dueCount: 4, newCount: 8, createdAt: new Date() },
];

const mockCards: Flashcard[] = [
  mkCard("c1", "Ephemeral", "Berlangsung sebentar; bersifat sementara.\n\n\"The beauty of cherry blossoms is ephemeral.\"", "d1", "Berhubungan dengan waktu", ["adjective"]),
  mkCard("c2", "Ubiquitous", "Hadir atau tampak di mana-mana.\n\n\"Smartphones have become ubiquitous.\"", "d1", "Kata sifat tentang keberadaan", ["adjective"]),
  mkCard("c3", "Serendipity", "Menemukan hal berharga secara tidak sengaja.", "d1", "Berhubungan dengan keberuntungan tak terduga", ["noun"]),
  mkCard("c4", "Integral ∫f(x)dx", "Luas area di bawah kurva f(x).\n\nRumus: ∫xⁿdx = xⁿ⁺¹/(n+1) + C", "d2", "Kebalikan dari diferensiasi", ["kalkulus"]),
  mkCard("c5", "Sumpah Pemuda", "28 Oktober 1928. Tiga ikrar: satu tanah air, satu bangsa, satu bahasa — Indonesia.", "d3", "Kongres Pemuda II", ["1928"]),
  mkCard("c6", "Mitokondria", "Organel sel penghasil ATP melalui respirasi seluler. Dijuluki \"powerhouse of the cell\".", "d4", "Organel bermembran ganda", ["organel"]),
];

// ============================================================
// THEME — clean light, Anki-inspired
// ============================================================

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4f6ef7" },
    secondary: { main: "#22c55e" },
    background: { default: "#f5f5f5", paper: "#ffffff" },
    text: { primary: "#1a1a1a", secondary: "#6b7280" },
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
    success: { main: "#22c55e" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: { styleOverrides: { root: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 6 } } },
  },
});

// ============================================================
// SIDEBAR
// ============================================================

const SIDEBAR_WIDTH = 220;

function Sidebar({ open, onClose, activePage, onNavigate }: {
  open: boolean; onClose: () => void; activePage: string; onNavigate: (p: string) => void;
}) {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const content = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: "primary.main" }}>🧠 INTERFAL</Typography>
        {isMobile && <IconButton sx={{ ml: "auto" }} size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>}
      </Box>
      <Divider />
      <List dense sx={{ px: 1, pt: 1 }}>
        {[
          { id: "dashboard", label: "Beranda", icon: <DashboardIcon fontSize="small" /> },
          { id: "decks", label: "Deck", icon: <DecksIcon fontSize="small" /> },
          { id: "stats", label: "Statistik", icon: <StatsIcon fontSize="small" /> },
        ].map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton
              selected={activePage === item.id}
              onClick={() => { onNavigate(item.id); if (isMobile) onClose(); }}
              sx={{
                borderRadius: 1.5, py: 0.75,
                "&.Mui-selected": { bgcolor: "primary.main", color: "white", "& .MuiListItemIcon-root": { color: "white" } },
                "&.Mui-selected:hover": { bgcolor: "primary.dark" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: "auto", p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FireIcon sx={{ color: "#f97316", fontSize: 18 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>7 hari streak</Typography>
        </Box>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer anchor="left" open={open} onClose={onClose}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH } } }}>
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, position: "fixed", left: 0, top: 0, height: "100vh", bgcolor: "background.paper", borderRight: "1px solid #e5e7eb", overflow: "auto" }}>
      {content}
    </Box>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({ onStudy, onNavigate }: { onStudy: (id: string) => void; onNavigate: (p: string) => void }) {
  const totalDue = mockDecks.reduce((s, d) => s + d.dueCount + d.newCount, 0);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Beranda</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
      </Typography>

      {/* Today summary */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Hari ini</Typography>
        <Grid container spacing={3}>
          {[
            { label: "Perlu diulang", value: totalDue, color: totalDue > 0 ? "error.main" : "text.secondary" },
            { label: "Selesai hari ini", value: 24, color: "success.main" },
            { label: "Akurasi", value: "87%", color: "primary.main" },
          ].map((s) => (
            <Grid size={{ xs: 4 }} key={s.label}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Deck list */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Deck</Typography>
        <Button size="small" onClick={() => onNavigate("decks")}>Kelola deck</Button>
      </Box>

      {mockDecks.map((deck) => (
        <Card key={deck._id} sx={{ mb: 1, p: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{deck.name}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ display: "block", color: "primary.main", fontWeight: 700 }}>{deck.newCount}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>baru</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ display: "block", color: "error.main", fontWeight: 700 }}>{deck.dueCount}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>ulang</Typography>
              </Box>
              <Button
                variant="contained" size="small" disableElevation
                disabled={deck.dueCount === 0 && deck.newCount === 0}
                onClick={() => onStudy(deck._id)}
                sx={{ minWidth: 70, fontSize: 12 }}
              >
                Belajar
              </Button>
            </Box>
          </Box>
        </Card>
      ))}

      {totalDue > 0 && (
        <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => onStudy("all")}>
          Pelajari semua ({totalDue} kartu)
        </Button>
      )}
    </Box>
  );
}

// ============================================================
// DECKS PAGE
// ============================================================

function DecksPage({ onStudy }: { onStudy: (id: string) => void }) {
  const [decks, setDecks] = useState<Deck[]>(mockDecks);
  const [cards, setCards] = useState<Flashcard[]>(mockCards);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [addDeckOpen, setAddDeckOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [editCard, setEditCard] = useState<Flashcard | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; deck: Deck } | null>(null);
  const [search, setSearch] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "" });

  const [draftDeck, setDraftDeck] = useState({ name: "", description: "" });
  const [draftCard, setDraftCard] = useState({ front: "", back: "", hint: "", tags: "" });

  const showSnack = (msg: string) => setSnack({ open: true, msg });

  const handleAddDeck = () => {
    if (!draftDeck.name.trim()) return;
    const d: Deck = { _id: `d${Date.now()}`, ...draftDeck, cardCount: 0, dueCount: 0, newCount: 0, createdAt: new Date() };
    setDecks(p => [...p, d]);
    setDraftDeck({ name: "", description: "" });
    setAddDeckOpen(false);
    showSnack("Deck ditambahkan");
  };

  const handleDeleteDeck = (id: string) => {
    setDecks(p => p.filter(d => d._id !== id));
    setCards(p => p.filter(c => c.deckId !== id));
    if (selectedDeck?._id === id) setSelectedDeck(null);
    showSnack("Deck dihapus");
  };

  const handleAddCard = () => {
    if (!draftCard.front.trim() || !draftCard.back.trim() || !selectedDeck) return;
    const isEdit = !!editCard;
    if (isEdit && editCard) {
      setCards(p => p.map(c => c._id === editCard._id ? {
        ...c, front: draftCard.front, back: draftCard.back,
        hint: draftCard.hint || undefined,
        tags: draftCard.tags.split(",").map(t => t.trim()).filter(Boolean),
        updatedAt: new Date(),
      } : c));
    } else {
      const newCard = mkCard(`c${Date.now()}`, draftCard.front, draftCard.back, selectedDeck._id, draftCard.hint || undefined, draftCard.tags.split(",").map(t => t.trim()).filter(Boolean));
      setCards(p => [...p, newCard]);
      setDecks(p => p.map(d => d._id === selectedDeck._id ? { ...d, cardCount: d.cardCount + 1, newCount: d.newCount + 1 } : d));
    }
    setDraftCard({ front: "", back: "", hint: "", tags: "" });
    setEditCard(null);
    setAddCardOpen(false);
    showSnack(isEdit ? "Kartu diperbarui" : "Kartu ditambahkan");
  };

  const handleEditCard = (card: Flashcard) => {
    setDraftCard({ front: card.front, back: card.back, hint: card.hint || "", tags: card.tags.join(", ") });
    setEditCard(card);
    setAddCardOpen(true);
  };

  const handleDeleteCard = (id: string) => {
    setCards(p => p.filter(c => c._id !== id));
    if (selectedDeck) setDecks(p => p.map(d => d._id === selectedDeck._id ? { ...d, cardCount: Math.max(0, d.cardCount - 1) } : d));
    showSnack("Kartu dihapus");
  };

  const deckCards = selectedDeck ? cards.filter(c => c.deckId === selectedDeck._id && (
    !search || c.front.toLowerCase().includes(search.toLowerCase()) || c.back.toLowerCase().includes(search.toLowerCase())
  )) : [];

  // Card detail view
  if (selectedDeck) {
    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <IconButton size="small" onClick={() => setSelectedDeck(null)}><BackIcon fontSize="small" /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{selectedDeck.name}</Typography>
            <Typography variant="caption" color="text.secondary">{deckCards.length} kartu</Typography>
          </Box>
          <Button size="small" variant="contained" disableElevation startIcon={<StudyIcon />} onClick={() => onStudy(selectedDeck._id)}>
            Belajar
          </Button>
          <Button size="small" startIcon={<AddIcon />} onClick={() => { setEditCard(null); setDraftCard({ front: "", back: "", hint: "", tags: "" }); setAddCardOpen(true); }}>
            Tambah
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth size="small" placeholder="Cari kartu..." value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />

        {/* Card list — Anki-style table */}
        {deckCards.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Belum ada kartu</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddCardOpen(true)}>Tambah kartu pertama</Button>
          </Box>
        ) : (
          <Card sx={{ overflow: "hidden" }}>
            {deckCards.map((card, i) => (
              <Box key={card._id}>
                {i > 0 && <Divider />}
                <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.25, gap: 1, "&:hover": { bgcolor: "#f9fafb" } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{card.front}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{card.back.split("\n")[0]}</Typography>
                  </Box>
                  <Chip
                    size="small" label={card.fsrs.state}
                    sx={{
                      height: 20, fontSize: 10, flexShrink: 0,
                      bgcolor: card.fsrs.state === "new" ? "#eff6ff" : card.fsrs.state === "review" ? "#f0fdf4" : "#fffbeb",
                      color: card.fsrs.state === "new" ? "#3b82f6" : card.fsrs.state === "review" ? "#16a34a" : "#d97706",
                      border: "none",
                    }}
                  />
                  <IconButton size="small" onClick={() => handleEditCard(card)}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                  <IconButton size="small" onClick={() => handleDeleteCard(card._id)} sx={{ color: "error.main" }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                </Box>
              </Box>
            ))}
          </Card>
        )}

        {/* Add/Edit Card Dialog */}
        <Dialog open={addCardOpen} onClose={() => { setAddCardOpen(false); setEditCard(null); }} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: 16 }}>{editCard ? "Edit Kartu" : "Tambah Kartu"}</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Depan" multiline rows={3} value={draftCard.front} onChange={e => setDraftCard(p => ({ ...p, front: e.target.value }))} sx={{ mb: 2, mt: 0.5 }} />
            <TextField fullWidth label="Belakang" multiline rows={4} value={draftCard.back} onChange={e => setDraftCard(p => ({ ...p, back: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Petunjuk (opsional)" value={draftCard.hint} onChange={e => setDraftCard(p => ({ ...p, hint: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Tag (pisahkan dengan koma)" value={draftCard.tags} onChange={e => setDraftCard(p => ({ ...p, tags: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAddCardOpen(false); setEditCard(null); }}>Batal</Button>
            <Button variant="contained" disableElevation onClick={handleAddCard}>{editCard ? "Simpan" : "Tambah"}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(p => ({ ...p, open: false }))} message={snack.msg} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Deck</Typography>
        <Button variant="contained" disableElevation size="small" startIcon={<AddIcon />} onClick={() => setAddDeckOpen(true)}>Buat deck</Button>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        {decks.map((deck, i) => (
          <Box key={deck._id}>
            {i > 0 && <Divider />}
            <Box
              sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1, cursor: "pointer", "&:hover": { bgcolor: "#f9fafb" } }}
              onClick={() => setSelectedDeck(deck)}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{deck.name}</Typography>
                {deck.description && <Typography variant="caption" color="text.secondary">{deck.description}</Typography>}
              </Box>
              <Box sx={{ display: "flex", gap: 2, mr: 1 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" sx={{ display: "block", color: "primary.main", fontWeight: 700 }}>{deck.newCount}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>baru</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" sx={{ display: "block", color: "error.main", fontWeight: 700 }}>{deck.dueCount}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>ulang</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" sx={{ display: "block", color: "text.primary", fontWeight: 700 }}>{deck.cardCount}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>total</Typography>
                </Box>
              </Box>
              <Button
                variant="contained" size="small" disableElevation
                disabled={deck.dueCount === 0 && deck.newCount === 0}
                onClick={e => { e.stopPropagation(); onStudy(deck._id); }}
                sx={{ minWidth: 70, fontSize: 12 }}
              >
                Belajar
              </Button>
              <IconButton size="small" onClick={e => { e.stopPropagation(); setMenuAnchor({ el: e.currentTarget, deck }); }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
        {decks.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography color="text.secondary">Belum ada deck</Typography>
          </Box>
        )}
      </Card>

      {/* Deck context menu */}
      <Menu anchorEl={menuAnchor?.el} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { menuAnchor && handleDeleteDeck(menuAnchor.deck._id); setMenuAnchor(null); }} sx={{ color: "error.main", fontSize: 14 }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />Hapus deck
        </MenuItem>
      </Menu>

      {/* Add Deck Dialog */}
      <Dialog open={addDeckOpen} onClose={() => setAddDeckOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 16 }}>Buat Deck Baru</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nama" value={draftDeck.name} onChange={e => setDraftDeck(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2, mt: 0.5 }} />
          <TextField fullWidth label="Deskripsi (opsional)" value={draftDeck.description} onChange={e => setDraftDeck(p => ({ ...p, description: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDeckOpen(false)}>Batal</Button>
          <Button variant="contained" disableElevation onClick={handleAddDeck}>Buat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// STATS PAGE
// ============================================================

function StatsPage() {
  const bars = [
    { day: "Sen", v: 18 }, { day: "Sel", v: 25 }, { day: "Rab", v: 12 },
    { day: "Kam", v: 30 }, { day: "Jum", v: 22 }, { day: "Sab", v: 8 }, { day: "Min", v: 24 },
  ];
  const max = Math.max(...bars.map(b => b.v));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Statistik</Typography>

      {/* Summary */}
      <Card sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2}>
          {[
            { label: "Streak", value: "7 hari", color: "#f97316" },
            { label: "Hari ini", value: "24", color: "text.primary" },
            { label: "Total review", value: "1.247", color: "text.primary" },
            { label: "Akurasi", value: "87%", color: "primary.main" },
          ].map(s => (
            <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Bar chart */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Review 7 hari terakhir</Typography>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 100 }}>
          {bars.map((b) => (
            <Box key={b.day} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{b.v}</Typography>
              <Box sx={{ width: "100%", bgcolor: "primary.main", height: `${(b.v / max) * 80}px`, borderRadius: "3px 3px 0 0", opacity: b.day === "Min" ? 1 : 0.5 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{b.day}</Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {/* Card state breakdown */}
      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Status kartu</Typography>
        {[
          { label: "Baru", count: 26, color: "#3b82f6" },
          { label: "Belajar", count: 18, color: "#f59e0b" },
          { label: "Review", count: 89, color: "#22c55e" },
          { label: "Dikuasai", count: 32, color: "#8b5cf6" },
        ].map(item => (
          <Box key={item.label} sx={{ mb: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
              <Typography variant="caption">{item.label}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.count}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={(item.count / 165) * 100}
              sx={{ height: 6, borderRadius: 3, bgcolor: "#f3f4f6", "& .MuiLinearProgress-bar": { bgcolor: item.color } }} />
          </Box>
        ))}
      </Card>
    </Box>
  );
}

// ============================================================
// STUDY SESSION
// ============================================================

const RATINGS = [
  { rating: 1 as Rating, label: "Lagi", color: "#ef4444", bg: "#fef2f2", key: "1" },
  { rating: 2 as Rating, label: "Sulit", color: "#f59e0b", bg: "#fffbeb", key: "2" },
  { rating: 3 as Rating, label: "Bagus", color: "#22c55e", bg: "#f0fdf4", key: "3" },
  { rating: 4 as Rating, label: "Mudah", color: "#3b82f6", bg: "#eff6ff", key: "4" },
];

function StudySession({ deckId, onFinish }: { deckId: string; onFinish: () => void }) {
  const src = deckId === "all" ? mockCards : mockCards.filter(c => c.deckId === deckId);
  const [queue, setQueue] = useState<Flashcard[]>([...src]);
  const [current, setCurrent] = useState<Flashcard | null>(src[0] || null);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [done, setDone] = useState(false);
  const [counts, setCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !flipped) { e.preventDefault(); setFlipped(true); }
      if (flipped && ["1", "2", "3", "4"].includes(e.key)) handleRate(Number(e.key) as Rating);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, current]);

  const handleRate = (rating: Rating) => {
    if (!current) return;
    setCounts(p => ({ ...p, [rating]: p[rating] + 1 }));
    setReviewed(r => r + 1);
    const rest = queue.filter(c => c._id !== current._id);
    const newQueue = rating === 1 ? [...rest.slice(0, 3), { ...current, fsrs: scheduleFSRS(current.fsrs, rating) }, ...rest.slice(3)] : rest;
    if (newQueue.length === 0) { setDone(true); return; }
    setCurrent(newQueue[0]);
    setQueue(newQueue);
    setFlipped(false);
    setShowHint(false);
  };

  const total = reviewed + queue.length;
  const progress = total > 0 ? (reviewed / total) * 100 : 0;

  if (done || (!current && src.length === 0)) {
    const good = counts[3] + counts[4];
    const acc = reviewed > 0 ? Math.round((good / reviewed) * 100) : 0;
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", textAlign: "center", pt: 6 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>✓</Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Sesi selesai!</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{reviewed} kartu diulas · akurasi {acc}%</Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {RATINGS.map(r => (
            <Grid size={{ xs: 3 }} key={r.rating}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: r.bg, border: `1px solid ${r.color}33` }}>
                <Typography sx={{ fontWeight: 700, color: r.color, fontSize: 18 }}>{counts[r.rating]}</Typography>
                <Typography variant="caption" color="text.secondary">{r.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Button variant="contained" disableElevation onClick={onFinish}>Kembali</Button>
      </Box>
    );
  }

  if (!current) return null;

  return (
    <Box sx={{ maxWidth: 560, mx: "auto" }}>
      {/* Top bar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Button size="small" startIcon={<BackIcon />} onClick={onFinish} sx={{ color: "text.secondary" }}>Keluar</Button>
        <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
        <Typography variant="caption" color="text.secondary">{reviewed}/{total}</Typography>
      </Box>

      {/* Card */}
      <Card sx={{ mb: 2, minHeight: 240, display: "flex", flexDirection: "column" }}>
        {/* Front */}
        <Box sx={{ flex: 1, p: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="body1" sx={{ textAlign: "center", fontWeight: 500, lineHeight: 1.6, fontSize: 18 }}>
            {current.front}
          </Typography>
          {current.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, mt: 2, flexWrap: "wrap", justifyContent: "center" }}>
              {current.tags.map(t => <Chip key={t} label={t} size="small" sx={{ fontSize: 10, height: 20 }} />)}
            </Box>
          )}
        </Box>

        {/* Back (shown after flip) */}
        <Collapse in={flipped}>
          <Divider />
          <Box sx={{ p: 4, bgcolor: "#fafafa" }}>
            <Typography variant="body1" sx={{ textAlign: "center", lineHeight: 1.7, whiteSpace: "pre-wrap", color: "text.primary" }}>
              {current.back}
            </Typography>
          </Box>
        </Collapse>
      </Card>

      {/* Hint */}
      {current.hint && !flipped && (
        <Box sx={{ mb: 2 }}>
          <Collapse in={showHint}>
            <Alert severity="info" variant="outlined" sx={{ mb: 1 }}>
              <Typography variant="body2">{current.hint}</Typography>
            </Alert>
          </Collapse>
          {!showHint && (
            <Button size="small" startIcon={<HintIcon />} onClick={() => setShowHint(true)} sx={{ color: "text.secondary" }}>
              Tampilkan petunjuk
            </Button>
          )}
        </Box>
      )}

      {/* Actions */}
      {!flipped ? (
        <Button
          fullWidth variant="contained" disableElevation size="large"
          onClick={() => setFlipped(true)}
          sx={{ py: 1.5 }}
        >
          Tampilkan jawaban
        </Button>
      ) : (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mb: 1 }}>
            Seberapa mudah kamu mengingat?
          </Typography>
          <Grid container spacing={1}>
            {RATINGS.map(r => (
              <Grid size={{ xs: 3 }} key={r.rating}>
                <Button
                  fullWidth variant="outlined"
                  onClick={() => handleRate(r.rating)}
                  sx={{
                    flexDirection: "column", py: 1.25, gap: 0.25,
                    borderColor: r.color + "88", color: r.color,
                    bgcolor: r.bg,
                    "&:hover": { bgcolor: r.color + "22", borderColor: r.color },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1 }}>{r.label}</Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.85 }}>{previewInterval(current.fsrs, r.rating)}</Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1 }}>
            Shortcut keyboard: Spasi = tampilkan · 1-4 = nilai
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  const [page, setPage] = useState<"dashboard" | "decks" | "stats" | "study">("dashboard");
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {page !== "study" && (
          <Sidebar
            open={sidebarOpen} onClose={() => setSidebarOpen(false)}
            activePage={page} onNavigate={p => setPage(p as any)}
          />
        )}

        <Box sx={{ flex: 1, ml: page !== "study" && !isMobile ? `${SIDEBAR_WIDTH}px` : 0, minHeight: "100vh", bgcolor: "background.default" }}>
          {/* Mobile topbar */}
          {page !== "study" && isMobile && (
            <Box sx={{ position: "sticky", top: 0, zIndex: 1100, bgcolor: "background.paper", borderBottom: "1px solid #e5e7eb", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton size="small" onClick={() => setSidebarOpen(true)}><MenuIcon /></IconButton>
              <Typography sx={{ fontWeight: 700, color: "primary.main", fontSize: 15 }}>🧠 INTERFAL</Typography>
            </Box>
          )}

          <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
            {page === "dashboard" && <Dashboard onStudy={id => { setStudyDeckId(id); setPage("study"); }} onNavigate={p => setPage(p as any)} />}
            {page === "decks" && <DecksPage onStudy={id => { setStudyDeckId(id); setPage("study"); }} />}
            {page === "stats" && <StatsPage />}
            {page === "study" && studyDeckId && <StudySession deckId={studyDeckId} onFinish={() => { setStudyDeckId(null); setPage("dashboard"); }} />}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}