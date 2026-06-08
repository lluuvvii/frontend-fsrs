"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
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
  Avatar,
  Tooltip,
  Fade,
  Collapse,
  Grid,
  Badge,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  LibraryBooks as DecksIcon,
  PlayArrow as StudyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Flip as FlipIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Bookmark as BookmarkIcon,
  Psychology as BrainIcon,
  EmojiEvents as TrophyIcon,
  Whatshot as FireIcon,
  BarChart as StatsIcon,
  Settings as SettingsIcon,
  Lightbulb as HintIcon,
  Visibility as PreviewIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";

// ============================================================
// TYPES
// ============================================================

type FSRSState = "new" | "learning" | "review" | "relearning";
type Rating = 1 | 2 | 3 | 4; // Again=1, Hard=2, Good=3, Easy=4

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
  color: string;
  icon: string;
  cardCount: number;
  dueCount: number;
  newCount: number;
  createdAt: Date;
}

interface StudyStats {
  totalReviews: number;
  streak: number;
  todayReviews: number;
  accuracy: number;
  totalCards: number;
  masteredCards: number;
}

// ============================================================
// MOCK FSRS ALGORITHM (client-side simplified)
// ============================================================

const FSRS_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,
  maximumInterval: 36500,
};

function initFSRS(): FSRSCard {
  return {
    due: new Date(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: "new",
  };
}

function scheduleFSRS(card: FSRSCard, rating: Rating): FSRSCard {
  const now = new Date();
  const elapsed = card.lastReview
    ? Math.max(0, (now.getTime() - card.lastReview.getTime()) / 86400000)
    : 0;

  let newCard = { ...card, elapsedDays: elapsed, lastReview: now };

  if (card.state === "new") {
    const initialStability = [1, 1.5, 2.5, 4][rating - 1];
    const initialDifficulty = Math.max(1, Math.min(10, 6 - (rating - 3) * 2));
    newCard.stability = initialStability;
    newCard.difficulty = initialDifficulty;
    newCard.reps = 1;
    if (rating === 1) {
      newCard.state = "learning";
      newCard.scheduledDays = 0;
      newCard.due = new Date(now.getTime() + 10 * 60 * 1000);
    } else {
      newCard.state = "review";
      const interval = Math.round(initialStability);
      newCard.scheduledDays = interval;
      newCard.due = new Date(now.getTime() + interval * 86400000);
    }
  } else if (card.state === "review") {
    newCard.reps += 1;
    if (rating === 1) {
      newCard.lapses += 1;
      newCard.state = "relearning";
      newCard.stability = Math.max(0.1, card.stability * 0.2);
      newCard.difficulty = Math.min(10, card.difficulty + 0.2);
      newCard.scheduledDays = 0;
      newCard.due = new Date(now.getTime() + 10 * 60 * 1000);
    } else {
      const difficultyDelta = [-0.15, -0.07, 0, 0.1][rating - 1];
      newCard.difficulty = Math.max(1, Math.min(10, card.difficulty + difficultyDelta));
      const retrievability = Math.exp(Math.log(0.9) * elapsed / card.stability);
      const stabilityFactor = [0.8, 0.9, 1.1, 1.3][rating - 1];
      newCard.stability = card.stability * (1 + Math.exp(FSRS_PARAMS.w[8]) * (11 - newCard.difficulty) * Math.pow(card.stability, -FSRS_PARAMS.w[9]) * (Math.exp((1 - retrievability) * FSRS_PARAMS.w[10]) - 1)) * stabilityFactor;
      const interval = Math.max(1, Math.min(FSRS_PARAMS.maximumInterval, Math.round(newCard.stability * Math.log(FSRS_PARAMS.requestRetention) / Math.log(0.9))));
      newCard.scheduledDays = interval;
      newCard.due = new Date(now.getTime() + interval * 86400000);
    }
  } else {
    // learning/relearning
    if (rating >= 3) {
      newCard.state = "review";
      newCard.stability = Math.max(1, newCard.stability * 1.5);
      newCard.scheduledDays = Math.round(newCard.stability);
      newCard.due = new Date(now.getTime() + newCard.scheduledDays * 86400000);
    } else {
      newCard.due = new Date(now.getTime() + 10 * 60 * 1000);
    }
  }

  return newCard;
}

// ============================================================
// MOCK DATA
// ============================================================

const DECK_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#84cc16"];
const DECK_ICONS = ["📚", "🧠", "🔬", "🌏", "🎵", "💻", "📐", "🗣️"];

const mockDecks: Deck[] = [
  { _id: "d1", name: "Kosakata Bahasa Inggris", description: "1000 kata paling umum", color: "#6366f1", icon: "🗣️", cardCount: 48, dueCount: 12, newCount: 5, createdAt: new Date() },
  { _id: "d2", name: "Rumus Matematika", description: "Kalkulus & Aljabar", color: "#06b6d4", icon: "📐", cardCount: 32, dueCount: 7, newCount: 3, createdAt: new Date() },
  { _id: "d3", name: "Sejarah Indonesia", description: "Dari kerajaan hingga kemerdekaan", color: "#10b981", icon: "🌏", cardCount: 60, dueCount: 20, newCount: 10, createdAt: new Date() },
  { _id: "d4", name: "Biologi Sel", description: "Struktur dan fungsi sel", color: "#f59e0b", icon: "🔬", cardCount: 25, dueCount: 4, newCount: 8, createdAt: new Date() },
];

const createMockCard = (id: string, front: string, back: string, deckId: string, hint?: string, tags: string[] = []): Flashcard => ({
  _id: id,
  front,
  back,
  hint,
  tags,
  deckId,
  fsrs: initFSRS(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockCards: Flashcard[] = [
  createMockCard("c1", "Ephemeral", "Berlangsung sebentar, bersifat sementara\n\n*\"The beauty of cherry blossoms is ephemeral\"*", "d1", "Berhubungan dengan waktu", ["adjective", "advanced"]),
  createMockCard("c2", "Ubiquitous", "Hadir atau tampak di mana-mana pada waktu yang sama\n\n*\"Smartphones have become ubiquitous\"*", "d1", "Kata sifat tentang keberadaan", ["adjective"]),
  createMockCard("c3", "Integral ∫f(x)dx", "Luas area di bawah kurva fungsi f(x)\n\n**Rumus dasar:** ∫xⁿdx = xⁿ⁺¹/(n+1) + C", "d2", "Operasi kebalikan dari diferensiasi", ["calculus", "formula"]),
  createMockCard("c4", "Sumpah Pemuda", "28 Oktober 1928\n\n**Isi:**\n1. Bertumpah darah satu, tanah air Indonesia\n2. Berbangsa satu, bangsa Indonesia\n3. Menjunjung bahasa persatuan, bahasa Indonesia", "d3", "Kongres Pemuda II", ["sejarah", "1928"]),
  createMockCard("c5", "Mitokondria", "Organel sel yang berfungsi sebagai \"pembangkit listrik\" sel\n\n**Fungsi:** Menghasilkan ATP melalui respirasi seluler\n**Dijuluki:** Powerhouse of the cell", "d4", "Organel bermembran ganda", ["organel", "energi"]),
  createMockCard("c6", "Serendipity", "Kejadian menemukan hal-hal berharga secara tidak sengaja\n\n*\"Finding that old friend was pure serendipity\"*", "d1", "Berhubungan dengan keberuntungan tak terduga", ["noun", "advanced"]),
];

const mockStats: StudyStats = {
  totalReviews: 1247,
  streak: 7,
  todayReviews: 24,
  accuracy: 87,
  totalCards: 165,
  masteredCards: 89,
};

// ============================================================
// THEME
// ============================================================

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#818cf8", light: "#a5b4fc", dark: "#4f46e5" },
    secondary: { main: "#34d399", light: "#6ee7b7", dark: "#059669" },
    background: { default: "#0a0a14", paper: "#111827" },
    text: { primary: "#f1f5f9", secondary: "#94a3b8" },
    error: { main: "#f87171" },
    warning: { main: "#fbbf24" },
    success: { main: "#34d399" },
  },
  typography: {
    fontFamily: '"DM Sans", "Noto Sans", sans-serif',
    h1: { fontFamily: '"Sora", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Sora", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Sora", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
  },
});

// ============================================================
// COMPONENTS
// ============================================================

// ---------- Sidebar ----------
const SIDEBAR_WIDTH = 260;

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { id: "decks", label: "Daftar Deck", icon: <DecksIcon /> },
  { id: "stats", label: "Statistik", icon: <StatsIcon /> },
];

function Sidebar({ open, onClose, activePage, onNavigate }: {
  open: boolean; onClose: () => void; activePage: string; onNavigate: (p: string) => void;
}) {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const content = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", pt: 2 }}>
      {/* Logo */}
      <Box sx={{ px: 3, pb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: "12px",
          background: "linear-gradient(135deg, #818cf8, #34d399)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20
        }}>🧠</Box>
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.2, color: "text.primary" }}>HafalCepat</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>FSRS Spaced Repetition</Typography>
        </Box>
        {isMobile && (
          <IconButton sx={{ ml: "auto" }} onClick={onClose}><CloseIcon /></IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />

      {/* Nav */}
      <List sx={{ px: 1.5, flex: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={activePage === item.id}
              onClick={() => { onNavigate(item.id); if (isMobile) onClose(); }}
              sx={{
                borderRadius: 2,
                "&.Mui-selected": {
                  bgcolor: "rgba(129,140,248,0.15)",
                  "& .MuiListItemIcon-root": { color: "primary.light" },
                  "& .MuiListItemText-primary": { color: "primary.light", fontWeight: 600 },
                },
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Study streak */}
      <Box sx={{ mx: 2, mb: 3, p: 2, borderRadius: 3, background: "linear-gradient(135deg, rgba(129,140,248,0.15), rgba(52,211,153,0.1))", border: "1px solid rgba(129,140,248,0.2)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <FireIcon sx={{ color: "#f97316", fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Streak Hari Ini</Typography>
        </Box>
        <Typography variant="h4" sx={{ color: "#f97316", fontWeight: 800 }}>{mockStats.streak}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>hari berturut-turut</Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer anchor="left" open={open} onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: SIDEBAR_WIDTH,
              bgcolor: "background.paper",
              borderRight: "1px solid rgba(255,255,255,0.06)",
            },
          },
        }}>
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{
      width: SIDEBAR_WIDTH, flexShrink: 0,
      position: "fixed", left: 0, top: 0, height: "100vh",
      bgcolor: "background.paper", borderRight: "1px solid rgba(255,255,255,0.06)",
      overflow: "auto",
    }}>
      {content}
    </Box>
  );
}

// ---------- StatCard ----------
function StatCard({ icon, label, value, color, sublabel }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; sublabel?: string;
}) {
  return (
    <Card sx={{ p: 2.5, height: "100%", position: "relative", overflow: "hidden" }}>
      <Box sx={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", bgcolor: color, opacity: 0.08
      }} />
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</Typography>
          <Typography variant="h4" sx={{ color, my: 0.5, fontWeight: 800 }}>{value}</Typography>
          {sublabel && <Typography variant="caption" sx={{ color: "text.secondary" }}>{sublabel}</Typography>}
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: color, opacity: 0.15, color }}>
          {icon}
        </Box>
      </Box>
    </Card>
  );
}

// ---------- Dashboard ----------
function Dashboard({ onStudy, onNavigate }: { onStudy: (deckId: string) => void; onNavigate: (p: string) => void }) {
  const totalDue = mockDecks.reduce((s, d) => s + d.dueCount, 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Selamat Datang! 👋</Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          Kamu memiliki <Box component="span" sx={{ color: "primary.light", fontWeight: 700 }}>{totalDue} kartu</Box> yang perlu diulang hari ini
        </Typography>
      </Box>

      {/* Quick study banner */}
      {totalDue > 0 && (
        <Card sx={{
          mb: 3, p: 3,
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%)",
          border: "none",
          position: "relative", overflow: "hidden",
        }}>
          <Box sx={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
          <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }} color="white">Mulai Belajar Sekarang</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{totalDue} kartu tersebar di {mockDecks.filter(d => d.dueCount > 0).length} deck</Typography>
            </Box>
            <Button variant="contained" size="large" startIcon={<StudyIcon />}
              onClick={() => onStudy("all")}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, color: "white", px: 3 }}>
              Mulai Sesi
            </Button>
          </Box>
        </Card>
      )}

      {/* Stats row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <CheckIcon />, label: "Review Hari Ini", value: mockStats.todayReviews, color: "#34d399", sublabel: "kartu selesai" },
          { icon: <TrendingUpIcon />, label: "Akurasi", value: `${mockStats.accuracy}%`, color: "#818cf8", sublabel: "rata-rata" },
          { icon: <BrainIcon />, label: "Total Kartu", value: mockStats.totalCards, color: "#06b6d4", sublabel: `${mockStats.masteredCards} dikuasai` },
          { icon: <TrophyIcon />, label: "Total Review", value: mockStats.totalReviews, color: "#f59e0b", sublabel: "sepanjang waktu" },
        ].map((s, i) => (
          <Grid size={{ xs: 6, md: 3 }} key={i}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Decks overview */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Deck Aktif</Typography>
        <Button size="small" onClick={() => onNavigate("decks")} sx={{ color: "primary.light" }}>Lihat Semua</Button>
      </Box>

      <Grid container spacing={2}>
        {mockDecks.slice(0, 4).map((deck) => (
          <Grid size={{ xs: 6, md: 3 }} key={deck._id}>
            <DeckCard deck={deck} onStudy={onStudy} compact />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ---------- DeckCard ----------
function DeckCard({ deck, onStudy, compact, onEdit, onDelete }: {
  deck: Deck; onStudy: (id: string) => void; compact?: boolean;
  onEdit?: (deck: Deck) => void; onDelete?: (id: string) => void;
}) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Card sx={{
      height: "100%", cursor: "pointer", transition: "all 0.2s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: `0 8px 32px rgba(0,0,0,0.4)` },
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, bgcolor: deck.color + "22",
              border: `1px solid ${deck.color}44`,
            }}>{deck.icon}</Box>
            <Box>
              <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>{deck.name}</Typography>
              {!compact && deck.description && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{deck.description}</Typography>
              )}
            </Box>
          </Box>
          {(onEdit || onDelete) && (
            <>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => { onEdit?.(deck); setMenuAnchor(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} />Edit</MenuItem>
                <MenuItem onClick={() => { onDelete?.(deck._id); setMenuAnchor(null); }} sx={{ color: "error.main" }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} />Hapus</MenuItem>
              </Menu>
            </>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip size="small" label={`${deck.cardCount} kartu`} sx={{ bgcolor: "rgba(255,255,255,0.06)", fontSize: 11 }} />
          {deck.dueCount > 0 && (
            <Chip size="small" label={`${deck.dueCount} due`} sx={{ bgcolor: "#ef444420", color: "#f87171", fontSize: 11 }} />
          )}
          {deck.newCount > 0 && (
            <Chip size="small" label={`${deck.newCount} baru`} sx={{ bgcolor: "#6366f120", color: "#a5b4fc", fontSize: 11 }} />
          )}
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Penguasaan</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {Math.round(((deck.cardCount - deck.dueCount - deck.newCount) / deck.cardCount) * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((deck.cardCount - deck.dueCount - deck.newCount) / deck.cardCount) * 100}
            sx={{
              height: 6, borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.06)",
              "& .MuiLinearProgress-bar": { bgcolor: deck.color, borderRadius: 3 }
            }}
          />
        </Box>

        <Button
          fullWidth variant="contained" size="small" startIcon={<StudyIcon />}
          disabled={deck.dueCount === 0 && deck.newCount === 0}
          onClick={() => onStudy(deck._id)}
          sx={{
            bgcolor: deck.color + "33", color: deck.color,
            border: `1px solid ${deck.color}44`,
            "&:hover": { bgcolor: deck.color + "55" },
            "&:disabled": { opacity: 0.4 },
          }}
        >
          {deck.dueCount > 0 || deck.newCount > 0 ? `Belajar (${deck.dueCount + deck.newCount})` : "Semua Selesai ✓"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------- Decks Page ----------
function DecksPage({ onStudy }: { onStudy: (id: string) => void }) {
  const [decks, setDecks] = useState<Deck[]>(mockDecks);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDeck, setEditDeck] = useState<Deck | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [editCard, setEditCard] = useState<Flashcard | null>(null);
  const [search, setSearch] = useState("");
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  const [newDeck, setNewDeck] = useState({ name: "", description: "", color: DECK_COLORS[0], icon: DECK_ICONS[0] });
  const [newCard, setNewCard] = useState({ front: "", back: "", hint: "", tags: "" });

  const showSnack = (msg: string, severity: "success" | "error" = "success") => setSnack({ open: true, msg, severity });

  const handleAddDeck = () => {
    if (!newDeck.name.trim()) return;
    const deck: Deck = {
      _id: `d${Date.now()}`, ...newDeck, cardCount: 0, dueCount: 0, newCount: 0, createdAt: new Date()
    };
    setDecks(prev => [...prev, deck]);
    setNewDeck({ name: "", description: "", color: DECK_COLORS[0], icon: DECK_ICONS[0] });
    setAddDialogOpen(false);
    showSnack("Deck berhasil dibuat!");
  };

  const handleDeleteDeck = (id: string) => {
    setDecks(prev => prev.filter(d => d._id !== id));
    showSnack("Deck dihapus.");
  };

  const handleSelectDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setDeckCards(mockCards.filter(c => c.deckId === deck._id));
  };

  const handleAddCard = () => {
    if (!newCard.front.trim() || !newCard.back.trim() || !selectedDeck) return;
    const card = createMockCard(
      `c${Date.now()}`, newCard.front, newCard.back, selectedDeck._id,
      newCard.hint, newCard.tags.split(",").map(t => t.trim()).filter(Boolean)
    );
    setDeckCards(prev => [...prev, card]);
    setDecks(prev => prev.map(d => d._id === selectedDeck._id ? { ...d, cardCount: d.cardCount + 1, newCount: d.newCount + 1 } : d));
    setNewCard({ front: "", back: "", hint: "", tags: "" });
    setAddCardOpen(false);
    showSnack("Kartu ditambahkan!");
  };

  const handleDeleteCard = (id: string) => {
    setDeckCards(prev => prev.filter(c => c._id !== id));
    if (selectedDeck) setDecks(prev => prev.map(d => d._id === selectedDeck._id ? { ...d, cardCount: Math.max(0, d.cardCount - 1) } : d));
    showSnack("Kartu dihapus.");
  };

  const filteredCards = deckCards.filter(c =>
    c.front.toLowerCase().includes(search.toLowerCase()) || c.back.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedDeck) {
    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <IconButton onClick={() => setSelectedDeck(null)}><BackIcon /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedDeck.icon} {selectedDeck.name}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{selectedDeck.description}</Typography>
          </Box>
          <Button variant="contained" startIcon={<StudyIcon />} onClick={() => onStudy(selectedDeck._id)}>Belajar</Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddCardOpen(true)}>Tambah Kartu</Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth placeholder="Cari kartu..." size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: "text.secondary",
                      fontSize: 20,
                    }}
                  />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
            },
          }}
        // sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
        />

        {filteredCards.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>📭</Typography>
            <Typography sx={{ color: "text.secondary" }}>Belum ada kartu di deck ini</Typography>
            <Button sx={{ mt: 2 }} variant="contained" startIcon={<AddIcon />} onClick={() => setAddCardOpen(true)}>Tambah Kartu Pertama</Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredCards.map(card => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card._id}>
                <Card sx={{ height: "100%", p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Chip size="small" label={card.fsrs.state} sx={{
                      bgcolor: card.fsrs.state === "new" ? "#6366f120" : card.fsrs.state === "review" ? "#10b98120" : "#f59e0b20",
                      color: card.fsrs.state === "new" ? "#a5b4fc" : card.fsrs.state === "review" ? "#34d399" : "#fbbf24",
                      fontSize: 10,
                    }} />
                    <Box>
                      <IconButton size="small" onClick={() => setEditCard(card)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteCard(card._id)} sx={{ color: "error.main" }}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>{card.front}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 12, mb: 1 }}>
                    {card.back.substring(0, 80)}{card.back.length > 80 ? "..." : ""}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {card.tags.map(tag => <Chip key={tag} label={tag} size="small" sx={{ fontSize: 10, height: 20 }} />)}
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
                    Due: {new Date(card.fsrs.due).toLocaleDateString("id-ID")}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add Card Dialog */}
        <Dialog open={addCardOpen} onClose={() => setAddCardOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Tambah Kartu Baru</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField fullWidth label="Depan (pertanyaan)" multiline rows={3} value={newCard.front} onChange={e => setNewCard(p => ({ ...p, front: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Belakang (jawaban)" multiline rows={4} value={newCard.back} onChange={e => setNewCard(p => ({ ...p, back: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Petunjuk (opsional)" value={newCard.hint} onChange={e => setNewCard(p => ({ ...p, hint: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Tag (pisahkan dengan koma)" value={newCard.tags} onChange={e => setNewCard(p => ({ ...p, tags: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddCardOpen(false)}>Batal</Button>
            <Button variant="contained" onClick={handleAddCard}>Tambah</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))}>
          <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Daftar Deck</Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }}>{decks.length} deck tersimpan</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>Buat Deck</Button>
      </Box>

      <Grid container spacing={2}>
        {decks.map(deck => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={deck._id}>
            <Box onClick={() => handleSelectDeck(deck)} sx={{ cursor: "pointer" }}>
              <DeckCard deck={deck} onStudy={onStudy}
                onEdit={(d) => setEditDeck(d)}
                onDelete={handleDeleteDeck}
              />
            </Box>
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{
            height: "100%", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", border: "2px dashed rgba(255,255,255,0.1)",
            transition: "all 0.2s",
            "&:hover": { borderColor: "primary.main", bgcolor: "rgba(129,140,248,0.05)" }
          }} onClick={() => setAddDialogOpen(true)}>
            <Box sx={{ textAlign: "center" }}>
              <AddIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
              <Typography sx={{ color: "text.secondary" }}>Buat Deck Baru</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Add Deck Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Buat Deck Baru</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Nama Deck" value={newDeck.name} onChange={e => setNewDeck(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="Deskripsi (opsional)" value={newDeck.description} onChange={e => setNewDeck(p => ({ ...p, description: e.target.value }))} sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Warna</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {DECK_COLORS.map(c => (
              <Box key={c} onClick={() => setNewDeck(p => ({ ...p, color: c }))} sx={{
                width: 32, height: 32, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                border: newDeck.color === c ? "3px solid white" : "3px solid transparent", transition: "all 0.15s"
              }} />
            ))}
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Ikon</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {DECK_ICONS.map(ic => (
              <Box key={ic} onClick={() => setNewDeck(p => ({ ...p, icon: ic }))} sx={{
                width: 40, height: 40, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, cursor: "pointer",
                bgcolor: newDeck.icon === ic ? "primary.main" + "33" : "rgba(255,255,255,0.05)",
                border: newDeck.icon === ic ? "2px solid" : "2px solid transparent",
                borderColor: newDeck.icon === ic ? "primary.main" : "transparent",
              }}>{ic}</Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleAddDeck}>Buat</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ---------- Stats Page ----------
function StatsPage() {
  const barData = [
    { day: "Sen", count: 18 }, { day: "Sel", count: 25 }, { day: "Rab", count: 12 },
    { day: "Kam", count: 30 }, { day: "Jum", count: 22 }, { day: "Sab", count: 8 }, { day: "Min", count: 24 },
  ];
  const maxBar = Math.max(...barData.map(b => b.count));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 800 }}>Statistik Belajar</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <FireIcon />, label: "Streak", value: `${mockStats.streak} hari`, color: "#f97316" },
          { icon: <CheckIcon />, label: "Hari Ini", value: mockStats.todayReviews, color: "#34d399", sublabel: "review selesai" },
          { icon: <TrendingUpIcon />, label: "Akurasi", value: `${mockStats.accuracy}%`, color: "#818cf8" },
          { icon: <TrophyIcon />, label: "Total Review", value: mockStats.totalReviews, color: "#f59e0b" },
        ].map((s, i) => (
          <Grid size={{ xs: 6, md: 3 }} key={i}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Weekly chart */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Review 7 Hari Terakhir</Typography>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 140 }}>
          {barData.map((b) => (
            <Box key={b.day} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{b.count}</Typography>
              <Box sx={{
                width: "100%", bgcolor: "#818cf8",
                height: `${(b.count / maxBar) * 100}%`,
                borderRadius: "6px 6px 0 0",
                minHeight: 8,
                opacity: b.day === "Min" ? 1 : 0.6,
                transition: "all 0.3s",
                "&:hover": { opacity: 1 },
              }} />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{b.day}</Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {/* Card states */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Distribusi Kartu</Typography>
        <Grid container spacing={2}>
          {[
            { label: "Baru", count: 26, color: "#818cf8", pct: 16 },
            { label: "Belajar", count: 18, color: "#fbbf24", pct: 11 },
            { label: "Review", count: 89, color: "#34d399", pct: 54 },
            { label: "Dikuasai", count: 32, color: "#06b6d4", pct: 19 },
          ].map((item) => (
            <Grid size={{ xs: 6, md: 3 }} key={item.label}>
              <Box sx={{ textAlign: "center", p: 2, borderRadius: 3, bgcolor: item.color + "15", border: `1px solid ${item.color}30` }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: item.color }}>{item.count}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{item.pct}%</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
}

// ---------- Study Session ----------
type StudyPhase = "intro" | "question" | "answer" | "done";

const RATING_CONFIG = [
  { rating: 1 as Rating, label: "Lagi", sublabel: "< 10 mnt", color: "#f87171", key: "1" },
  { rating: 2 as Rating, label: "Sulit", sublabel: "beberapa hari", color: "#fbbf24", key: "2" },
  { rating: 3 as Rating, label: "Bagus", sublabel: "4 hari", color: "#34d399", key: "3" },
  { rating: 4 as Rating, label: "Mudah", sublabel: "9 hari", color: "#818cf8", key: "4" },
];

function StudySession({ deckId, onFinish }: { deckId: string; onFinish: () => void }) {
  const cards = deckId === "all"
    ? mockCards
    : mockCards.filter(c => c.deckId === deckId);

  const [queue, setQueue] = useState<Flashcard[]>([...cards]);
  const [current, setCurrent] = useState<Flashcard | null>(cards[0] || null);
  const [phase, setPhase] = useState<StudyPhase>(cards.length ? "question" : "done");
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });

  const progress = reviewed / (reviewed + queue.length) * 100;

  const handleFlip = () => setFlipped(true);

  const handleRate = (rating: Rating) => {
    if (!current) return;
    const updated = scheduleFSRS(current.fsrs, rating);
    console.log("FSRS scheduled:", updated);

    setRatingCounts(prev => ({ ...prev, [rating]: prev[rating as keyof typeof prev] + 1 }));
    setReviewed(r => r + 1);

    const remaining = queue.filter(c => c._id !== current._id);

    // If again, re-queue this card
    const newQueue = rating === 1 ? [...remaining.slice(0, 2), { ...current, fsrs: updated }, ...remaining.slice(2)] : remaining;

    if (newQueue.length === 0) {
      setPhase("done");
    } else {
      setCurrent(newQueue[0]);
      setQueue(newQueue);
      setFlipped(false);
      setShowHint(false);
    }
  };

  if (phase === "done") {
    const accuracy = reviewed > 0 ? Math.round(((ratingCounts[3] + ratingCounts[4]) / reviewed) * 100) : 0;
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>🎉</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Sesi Selesai!</Typography>
        <Typography sx={{ color: "text.secondary", mb: 4 }}>Kerja bagus! Kamu telah menyelesaikan sesi belajar hari ini.</Typography>

        <Grid container spacing={2} sx={{ maxWidth: 480, mx: "auto", mb: 4 }}>
          <Grid size={{ xs: 6 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.light" }}>{reviewed}</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Kartu Diulas</Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "secondary.main" }}>{accuracy}%</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Akurasi</Typography>
            </Card>
          </Grid>
          {RATING_CONFIG.map(r => (
            <Grid size={{ xs: 3 }} key={r.rating}>
              <Card sx={{ p: 1.5, bgcolor: r.color + "15" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: r.color }}>{ratingCounts[r.rating]}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{r.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Button variant="contained" size="large" onClick={onFinish}>Kembali ke Dashboard</Button>
      </Box>
    );
  }

  if (!current) return null;

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <IconButton onClick={onFinish}><BackIcon /></IconButton>
        <Box sx={{ flex: 1, mx: 2 }}>
          <LinearProgress variant="determinate" value={progress}
            sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.06)", "& .MuiLinearProgress-bar": { bgcolor: "primary.main", borderRadius: 4 } }} />
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5, textAlign: "center" }}>
            {reviewed} / {reviewed + queue.length} kartu
          </Typography>
        </Box>
        <Chip size="small" label={current.fsrs.state}
          sx={{
            bgcolor: current.fsrs.state === "new" ? "#6366f120" : "#10b98120",
            color: current.fsrs.state === "new" ? "#a5b4fc" : "#34d399",
          }} />
      </Box>

      {/* Card */}
      <Box sx={{
        perspective: "1000px",
        mb: 3,
      }}>
        <Box sx={{
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: 280,
        }}>
          {/* Front */}
          <Card sx={{
            position: flipped ? "absolute" : "relative",
            width: "100%", p: 4,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            minHeight: 280,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #111827, #1e2940)",
          }}>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 2, textTransform: "uppercase", letterSpacing: 1 }}>Pertanyaan</Typography>
            <Typography variant="h5" sx={{ textAlign: "center", lineHeight: 1.4, fontWeight: 700 }}>{current.front}</Typography>
            {current.tags.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5, mt: 2, flexWrap: "wrap", justifyContent: "center" }}>
                {current.tags.map(t => <Chip key={t} label={t} size="small" sx={{ fontSize: 10, height: 20 }} />)}
              </Box>
            )}
          </Card>

          {/* Back */}
          <Card sx={{
            position: "absolute", top: 0, left: 0, width: "100%", p: 4,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            minHeight: 280,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #1a1f3a, #111827)",
            border: "1px solid rgba(129,140,248,0.2)",
          }}>
            <Typography variant="caption" sx={{ color: "primary.light", mb: 2, textTransform: "uppercase", letterSpacing: 1 }}>Jawaban</Typography>
            <Typography variant="body1" sx={{ textAlign: "center", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{current.back}</Typography>
          </Card>
        </Box>
      </Box>

      {/* Hint */}
      {current.hint && !flipped && (
        <Collapse in={showHint}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
            <Typography variant="body2"><strong>Petunjuk:</strong> {current.hint}</Typography>
          </Alert>
        </Collapse>
      )}

      {/* Actions */}
      {!flipped ? (
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          {current.hint && (
            <Button variant="outlined" startIcon={<HintIcon />} onClick={() => setShowHint(s => !s)} sx={{ borderRadius: 3 }}>
              {showHint ? "Sembunyikan" : "Petunjuk"}
            </Button>
          )}
          <Button variant="contained" size="large" startIcon={<FlipIcon />} onClick={handleFlip}
            sx={{ px: 4, borderRadius: 3, background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            Tampilkan Jawaban
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mb: 2 }}>Seberapa mudah kamu mengingat ini?</Typography>
          <Grid container spacing={1.5}>
            {RATING_CONFIG.map(r => (
              <Grid size={{ xs: 3 }} key={r.rating}>
                <Button
                  fullWidth variant="contained" onClick={() => handleRate(r.rating)}
                  sx={{
                    bgcolor: r.color + "22", color: r.color,
                    border: `1px solid ${r.color}44`,
                    "&:hover": { bgcolor: r.color + "44" },
                    flexDirection: "column", py: 1.5, gap: 0.25,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.label}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 10 }}>{r.sublabel}</Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", textAlign: "center", mt: 1.5 }}>
            Tekan <strong>1</strong> Lagi · <strong>2</strong> Sulit · <strong>3</strong> Bagus · <strong>4</strong> Mudah
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [page, setPage] = useState<"dashboard" | "decks" | "stats" | "study">("dashboard");
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Keyboard shortcut for ratings during study
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (page !== "study") return;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [page]);

  const handleStudy = (deckId: string) => {
    setStudyDeckId(deckId);
    setPage("study");
  };

  const handleFinishStudy = () => {
    setStudyDeckId(null);
    setPage("dashboard");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        {/* Sidebar */}
        {page !== "study" && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activePage={page}
            onNavigate={(p) => setPage(p as any)}
          />
        )}

        {/* Main content */}
        <Box sx={{
          flex: 1,
          ml: page !== "study" && !isMobile ? `${SIDEBAR_WIDTH}px` : 0,
          minHeight: "100vh",
        }}>
          {/* Top bar (mobile) */}
          {page !== "study" && isMobile && (
            <Box sx={{
              position: "sticky", top: 0, zIndex: 1100,
              bgcolor: "background.default", borderBottom: "1px solid rgba(255,255,255,0.06)",
              px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5,
            }}>
              <IconButton onClick={() => setSidebarOpen(true)}><MenuIcon /></IconButton>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>🧠 HafalCepat</Typography>
            </Box>
          )}

          <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
            {page === "dashboard" && <Dashboard onStudy={handleStudy} onNavigate={(p) => setPage(p as any)} />}
            {page === "decks" && <DecksPage onStudy={handleStudy} />}
            {page === "stats" && <StatsPage />}
            {page === "study" && studyDeckId && <StudySession deckId={studyDeckId} onFinish={handleFinishStudy} />}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}