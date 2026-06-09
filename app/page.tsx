// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import {
//   ThemeProvider,
//   createTheme,
//   CssBaseline,
//   Box,
//   Container,
//   Typography,
//   Button,
//   Card,
//   CardContent,
//   IconButton,
//   Drawer,
//   List,
//   ListItem,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Chip,
//   LinearProgress,
//   Avatar,
//   Tooltip,
//   Fade,
//   Collapse,
//   Grid,
//   Badge,
//   Divider,
//   Alert,
//   Snackbar,
//   CircularProgress,
//   Menu,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   useMediaQuery,
//   InputAdornment,
// } from "@mui/material";
// import {
//   Dashboard as DashboardIcon,
//   LibraryBooks as DecksIcon,
//   PlayArrow as StudyIcon,
//   Add as AddIcon,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Menu as MenuIcon,
//   Close as CloseIcon,
//   Flip as FlipIcon,
//   CheckCircle as CheckIcon,
//   Schedule as ScheduleIcon,
//   TrendingUp as TrendingUpIcon,
//   Star as StarIcon,
//   StarBorder as StarBorderIcon,
//   ExpandMore as ExpandMoreIcon,
//   ExpandLess as ExpandLessIcon,
//   Bookmark as BookmarkIcon,
//   Psychology as BrainIcon,
//   EmojiEvents as TrophyIcon,
//   Whatshot as FireIcon,
//   BarChart as StatsIcon,
//   Settings as SettingsIcon,
//   Lightbulb as HintIcon,
//   Visibility as PreviewIcon,
//   MoreVert as MoreVertIcon,
//   Search as SearchIcon,
//   FilterList as FilterIcon,
//   Sort as SortIcon,
//   ArrowBack as BackIcon,
// } from "@mui/icons-material";

// // ============================================================
// // TYPES
// // ============================================================

// type FSRSState = "new" | "learning" | "review" | "relearning";
// type Rating = 1 | 2 | 3 | 4; // Again=1, Hard=2, Good=3, Easy=4

// interface FSRSCard {
//   due: Date;
//   stability: number;
//   difficulty: number;
//   elapsedDays: number;
//   scheduledDays: number;
//   reps: number;
//   lapses: number;
//   state: FSRSState;
//   lastReview?: Date;
// }

// interface Flashcard {
//   _id: string;
//   front: string;
//   back: string;
//   hint?: string;
//   tags: string[];
//   deckId: string;
//   fsrs: FSRSCard;
//   createdAt: Date;
//   updatedAt: Date;
// }

// interface Deck {
//   _id: string;
//   name: string;
//   description?: string;
//   color: string;
//   icon: string;
//   cardCount: number;
//   dueCount: number;
//   newCount: number;
//   createdAt: Date;
// }

// interface StudyStats {
//   totalReviews: number;
//   streak: number;
//   todayReviews: number;
//   accuracy: number;
//   totalCards: number;
//   masteredCards: number;
// }

// // ============================================================
// // MOCK FSRS ALGORITHM (client-side simplified)
// // ============================================================

// const FSRS_PARAMS = {
//   w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
//   requestRetention: 0.9,
//   maximumInterval: 36500,
// };

// function initFSRS(): FSRSCard {
//   return {
//     due: new Date(),
//     stability: 0,
//     difficulty: 0,
//     elapsedDays: 0,
//     scheduledDays: 0,
//     reps: 0,
//     lapses: 0,
//     state: "new",
//   };
// }

// function scheduleFSRS(card: FSRSCard, rating: Rating): FSRSCard {
//   const now = new Date();
//   const elapsed = card.lastReview
//     ? Math.max(0, (now.getTime() - card.lastReview.getTime()) / 86400000)
//     : 0;

//   let newCard = { ...card, elapsedDays: elapsed, lastReview: now };

//   if (card.state === "new") {
//     const initialStability = [1, 1.5, 2.5, 4][rating - 1];
//     const initialDifficulty = Math.max(1, Math.min(10, 6 - (rating - 3) * 2));
//     newCard.stability = initialStability;
//     newCard.difficulty = initialDifficulty;
//     newCard.reps = 1;
//     if (rating === 1) {
//       newCard.state = "learning";
//       newCard.scheduledDays = 0;
//       newCard.due = new Date(now.getTime() + 10 * 60 * 1000);
//     } else {
//       newCard.state = "review";
//       const interval = Math.round(initialStability);
//       newCard.scheduledDays = interval;
//       newCard.due = new Date(now.getTime() + interval * 86400000);
//     }
//   } else if (card.state === "review") {
//     newCard.reps += 1;
//     if (rating === 1) {
//       newCard.lapses += 1;
//       newCard.state = "relearning";
//       newCard.stability = Math.max(0.1, card.stability * 0.2);
//       newCard.difficulty = Math.min(10, card.difficulty + 0.2);
//       newCard.scheduledDays = 0;
//       newCard.due = new Date(now.getTime() + 10 * 60 * 1000);
//     } else {
//       const difficultyDelta = [-0.15, -0.07, 0, 0.1][rating - 1];
//       newCard.difficulty = Math.max(1, Math.min(10, card.difficulty + difficultyDelta));
//       const retrievability = Math.exp(Math.log(0.9) * elapsed / card.stability);
//       const stabilityFactor = [0.8, 0.9, 1.1, 1.3][rating - 1];
//       newCard.stability = card.stability * (1 + Math.exp(FSRS_PARAMS.w[8]) * (11 - newCard.difficulty) * Math.pow(card.stability, -FSRS_PARAMS.w[9]) * (Math.exp((1 - retrievability) * FSRS_PARAMS.w[10]) - 1)) * stabilityFactor;
//       const interval = Math.max(1, Math.min(FSRS_PARAMS.maximumInterval, Math.round(newCard.stability * Math.log(FSRS_PARAMS.requestRetention) / Math.log(0.9))));
//       newCard.scheduledDays = interval;
//       newCard.due = new Date(now.getTime() + interval * 86400000);
//     }
//   } else {
//     // learning/relearning
//     if (rating >= 3) {
//       newCard.state = "review";
//       newCard.stability = Math.max(1, newCard.stability * 1.5);
//       newCard.scheduledDays = Math.round(newCard.stability);
//       newCard.due = new Date(now.getTime() + newCard.scheduledDays * 86400000);
//     } else {
//       newCard.due = new Date(now.getTime() + 10 * 60 * 1000);
//     }
//   }

//   return newCard;
// }

// // ============================================================
// // MOCK DATA
// // ============================================================

// const DECK_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#84cc16"];
// const DECK_ICONS = ["📚", "🧠", "🔬", "🌏", "🎵", "💻", "📐", "🗣️"];

// const mockDecks: Deck[] = [
//   { _id: "d1", name: "Kosakata Bahasa Inggris", description: "1000 kata paling umum", color: "#6366f1", icon: "🗣️", cardCount: 48, dueCount: 12, newCount: 5, createdAt: new Date() },
//   { _id: "d2", name: "Rumus Matematika", description: "Kalkulus & Aljabar", color: "#06b6d4", icon: "📐", cardCount: 32, dueCount: 7, newCount: 3, createdAt: new Date() },
//   { _id: "d3", name: "Sejarah Indonesia", description: "Dari kerajaan hingga kemerdekaan", color: "#10b981", icon: "🌏", cardCount: 60, dueCount: 20, newCount: 10, createdAt: new Date() },
//   { _id: "d4", name: "Biologi Sel", description: "Struktur dan fungsi sel", color: "#f59e0b", icon: "🔬", cardCount: 25, dueCount: 4, newCount: 8, createdAt: new Date() },
// ];

// const createMockCard = (id: string, front: string, back: string, deckId: string, hint?: string, tags: string[] = []): Flashcard => ({
//   _id: id,
//   front,
//   back,
//   hint,
//   tags,
//   deckId,
//   fsrs: initFSRS(),
//   createdAt: new Date(),
//   updatedAt: new Date(),
// });

// const mockCards: Flashcard[] = [
//   createMockCard("c1", "Ephemeral", "Berlangsung sebentar, bersifat sementara\n\n*\"The beauty of cherry blossoms is ephemeral\"*", "d1", "Berhubungan dengan waktu", ["adjective", "advanced"]),
//   createMockCard("c2", "Ubiquitous", "Hadir atau tampak di mana-mana pada waktu yang sama\n\n*\"Smartphones have become ubiquitous\"*", "d1", "Kata sifat tentang keberadaan", ["adjective"]),
//   createMockCard("c3", "Integral ∫f(x)dx", "Luas area di bawah kurva fungsi f(x)\n\n**Rumus dasar:** ∫xⁿdx = xⁿ⁺¹/(n+1) + C", "d2", "Operasi kebalikan dari diferensiasi", ["calculus", "formula"]),
//   createMockCard("c4", "Sumpah Pemuda", "28 Oktober 1928\n\n**Isi:**\n1. Bertumpah darah satu, tanah air Indonesia\n2. Berbangsa satu, bangsa Indonesia\n3. Menjunjung bahasa persatuan, bahasa Indonesia", "d3", "Kongres Pemuda II", ["sejarah", "1928"]),
//   createMockCard("c5", "Mitokondria", "Organel sel yang berfungsi sebagai \"pembangkit listrik\" sel\n\n**Fungsi:** Menghasilkan ATP melalui respirasi seluler\n**Dijuluki:** Powerhouse of the cell", "d4", "Organel bermembran ganda", ["organel", "energi"]),
//   createMockCard("c6", "Serendipity", "Kejadian menemukan hal-hal berharga secara tidak sengaja\n\n*\"Finding that old friend was pure serendipity\"*", "d1", "Berhubungan dengan keberuntungan tak terduga", ["noun", "advanced"]),
// ];

// const mockStats: StudyStats = {
//   totalReviews: 1247,
//   streak: 7,
//   todayReviews: 24,
//   accuracy: 87,
//   totalCards: 165,
//   masteredCards: 89,
// };

// // ============================================================
// // THEME
// // ============================================================

// const theme = createTheme({
//   palette: {
//     mode: "dark",
//     primary: { main: "#818cf8", light: "#a5b4fc", dark: "#4f46e5" },
//     secondary: { main: "#34d399", light: "#6ee7b7", dark: "#059669" },
//     background: { default: "#0a0a14", paper: "#111827" },
//     text: { primary: "#f1f5f9", secondary: "#94a3b8" },
//     error: { main: "#f87171" },
//     warning: { main: "#fbbf24" },
//     success: { main: "#34d399" },
//   },
//   typography: {
//     fontFamily: '"DM Sans", "Noto Sans", sans-serif',
//     h1: { fontFamily: '"Sora", sans-serif', fontWeight: 800 },
//     h2: { fontFamily: '"Sora", sans-serif', fontWeight: 700 },
//     h3: { fontFamily: '"Sora", sans-serif', fontWeight: 700 },
//     h4: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
//     h5: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
//     h6: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
//   },
//   shape: { borderRadius: 16 },
//   components: {
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           backgroundImage: "none",
//           border: "1px solid rgba(255,255,255,0.06)",
//         },
//       },
//     },
//     MuiButton: {
//       styleOverrides: {
//         root: {
//           textTransform: "none",
//           fontWeight: 600,
//           borderRadius: 12,
//         },
//       },
//     },
//     MuiChip: {
//       styleOverrides: {
//         root: { borderRadius: 8, fontWeight: 500 },
//       },
//     },
//     MuiDialog: {
//       styleOverrides: {
//         paper: {
//           backgroundImage: "none",
//           backgroundColor: "#111827",
//           border: "1px solid rgba(255,255,255,0.08)",
//         },
//       },
//     },
//   },
// });

// // ============================================================
// // COMPONENTS
// // ============================================================

// // ---------- Sidebar ----------
// const SIDEBAR_WIDTH = 260;

// const navItems = [
//   { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
//   { id: "decks", label: "Daftar Deck", icon: <DecksIcon /> },
//   { id: "stats", label: "Statistik", icon: <StatsIcon /> },
// ];

// function Sidebar({ open, onClose, activePage, onNavigate }: {
//   open: boolean; onClose: () => void; activePage: string; onNavigate: (p: string) => void;
// }) {
//   const isMobile = useMediaQuery(theme.breakpoints.down("md"));

//   const content = (
//     <Box sx={{ height: "100%", display: "flex", flexDirection: "column", pt: 2 }}>
//       {/* Logo */}
//       <Box sx={{ px: 3, pb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
//         <Box sx={{
//           width: 40, height: 40, borderRadius: "12px",
//           background: "linear-gradient(135deg, #818cf8, #34d399)",
//           display: "flex", alignItems: "center", justifyContent: "center",
//           fontSize: 20
//         }}>🧠</Box>
//         <Box>
//           <Typography variant="h6" sx={{ lineHeight: 1.2, color: "text.primary" }}>HafalCepat</Typography>
//           <Typography variant="caption" sx={{ color: "text.secondary" }}>FSRS Spaced Repetition</Typography>
//         </Box>
//         {isMobile && (
//           <IconButton sx={{ ml: "auto" }} onClick={onClose}><CloseIcon /></IconButton>
//         )}
//       </Box>

//       <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />

//       {/* Nav */}
//       <List sx={{ px: 1.5, flex: 1 }}>
//         {navItems.map((item) => (
//           <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
//             <ListItemButton
//               selected={activePage === item.id}
//               onClick={() => { onNavigate(item.id); if (isMobile) onClose(); }}
//               sx={{
//                 borderRadius: 2,
//                 "&.Mui-selected": {
//                   bgcolor: "rgba(129,140,248,0.15)",
//                   "& .MuiListItemIcon-root": { color: "primary.light" },
//                   "& .MuiListItemText-primary": { color: "primary.light", fontWeight: 600 },
//                 },
//                 "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
//               }}
//             >
//               <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>{item.icon}</ListItemIcon>
//               <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
//             </ListItemButton>
//           </ListItem>
//         ))}
//       </List>

//       {/* Study streak */}
//       <Box sx={{ mx: 2, mb: 3, p: 2, borderRadius: 3, background: "linear-gradient(135deg, rgba(129,140,248,0.15), rgba(52,211,153,0.1))", border: "1px solid rgba(129,140,248,0.2)" }}>
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
//           <FireIcon sx={{ color: "#f97316", fontSize: 20 }} />
//           <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Streak Hari Ini</Typography>
//         </Box>
//         <Typography variant="h4" sx={{ color: "#f97316", fontWeight: 800 }}>{mockStats.streak}</Typography>
//         <Typography variant="caption" sx={{ color: "text.secondary" }}>hari berturut-turut</Typography>
//       </Box>
//     </Box>
//   );

//   if (isMobile) {
//     return (
//       <Drawer anchor="left" open={open} onClose={onClose}
//         slotProps={{
//           paper: {
//             sx: {
//               width: SIDEBAR_WIDTH,
//               bgcolor: "background.paper",
//               borderRight: "1px solid rgba(255,255,255,0.06)",
//             },
//           },
//         }}>
//         {content}
//       </Drawer>
//     );
//   }

//   return (
//     <Box sx={{
//       width: SIDEBAR_WIDTH, flexShrink: 0,
//       position: "fixed", left: 0, top: 0, height: "100vh",
//       bgcolor: "background.paper", borderRight: "1px solid rgba(255,255,255,0.06)",
//       overflow: "auto",
//     }}>
//       {content}
//     </Box>
//   );
// }

// // ---------- StatCard ----------
// function StatCard({ icon, label, value, color, sublabel }: {
//   icon: React.ReactNode; label: string; value: string | number; color: string; sublabel?: string;
// }) {
//   return (
//     <Card sx={{ p: 2.5, height: "100%", position: "relative", overflow: "hidden" }}>
//       <Box sx={{
//         position: "absolute", top: -20, right: -20, width: 80, height: 80,
//         borderRadius: "50%", bgcolor: color, opacity: 0.08
//       }} />
//       <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
//         <Box>
//           <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</Typography>
//           <Typography variant="h4" sx={{ color, my: 0.5, fontWeight: 800 }}>{value}</Typography>
//           {sublabel && <Typography variant="caption" sx={{ color: "text.secondary" }}>{sublabel}</Typography>}
//         </Box>
//         <Box sx={{ p: 1, borderRadius: 2, bgcolor: color, opacity: 0.15, color }}>
//           {icon}
//         </Box>
//       </Box>
//     </Card>
//   );
// }

// // ---------- Dashboard ----------
// function Dashboard({ onStudy, onNavigate }: { onStudy: (deckId: string) => void; onNavigate: (p: string) => void }) {
//   const totalDue = mockDecks.reduce((s, d) => s + d.dueCount, 0);

//   return (
//     <Box>
//       {/* Header */}
//       <Box sx={{ mb: 4 }}>
//         <Typography variant="h4" sx={{ fontWeight: 800 }}>Selamat Datang! 👋</Typography>
//         <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
//           Kamu memiliki <Box component="span" sx={{ color: "primary.light", fontWeight: 700 }}>{totalDue} kartu</Box> yang perlu diulang hari ini
//         </Typography>
//       </Box>

//       {/* Quick study banner */}
//       {totalDue > 0 && (
//         <Card sx={{
//           mb: 3, p: 3,
//           background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%)",
//           border: "none",
//           position: "relative", overflow: "hidden",
//         }}>
//           <Box sx={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
//           <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
//             <Box>
//               <Typography variant="h5" sx={{ fontWeight: 800 }} color="white">Mulai Belajar Sekarang</Typography>
//               <Typography sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{totalDue} kartu tersebar di {mockDecks.filter(d => d.dueCount > 0).length} deck</Typography>
//             </Box>
//             <Button variant="contained" size="large" startIcon={<StudyIcon />}
//               onClick={() => onStudy("all")}
//               sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, color: "white", px: 3 }}>
//               Mulai Sesi
//             </Button>
//           </Box>
//         </Card>
//       )}

//       {/* Stats row */}
//       <Grid container spacing={2} sx={{ mb: 3 }}>
//         {[
//           { icon: <CheckIcon />, label: "Review Hari Ini", value: mockStats.todayReviews, color: "#34d399", sublabel: "kartu selesai" },
//           { icon: <TrendingUpIcon />, label: "Akurasi", value: `${mockStats.accuracy}%`, color: "#818cf8", sublabel: "rata-rata" },
//           { icon: <BrainIcon />, label: "Total Kartu", value: mockStats.totalCards, color: "#06b6d4", sublabel: `${mockStats.masteredCards} dikuasai` },
//           { icon: <TrophyIcon />, label: "Total Review", value: mockStats.totalReviews, color: "#f59e0b", sublabel: "sepanjang waktu" },
//         ].map((s, i) => (
//           <Grid size={{ xs: 6, md: 3 }} key={i}>
//             <StatCard {...s} />
//           </Grid>
//         ))}
//       </Grid>

//       {/* Decks overview */}
//       <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
//         <Typography variant="h6" sx={{ fontWeight: 700 }}>Deck Aktif</Typography>
//         <Button size="small" onClick={() => onNavigate("decks")} sx={{ color: "primary.light" }}>Lihat Semua</Button>
//       </Box>

//       <Grid container spacing={2}>
//         {mockDecks.slice(0, 4).map((deck) => (
//           <Grid size={{ xs: 6, md: 3 }} key={deck._id}>
//             <DeckCard deck={deck} onStudy={onStudy} compact />
//           </Grid>
//         ))}
//       </Grid>
//     </Box>
//   );
// }

// // ---------- DeckCard ----------
// function DeckCard({ deck, onStudy, compact, onEdit, onDelete }: {
//   deck: Deck; onStudy: (id: string) => void; compact?: boolean;
//   onEdit?: (deck: Deck) => void; onDelete?: (id: string) => void;
// }) {
//   const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

//   return (
//     <Card sx={{
//       height: "100%", cursor: "pointer", transition: "all 0.2s",
//       "&:hover": { transform: "translateY(-2px)", boxShadow: `0 8px 32px rgba(0,0,0,0.4)` },
//     }}>
//       <CardContent sx={{ p: 2.5 }}>
//         <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//             <Box sx={{
//               width: 44, height: 44, borderRadius: "12px",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               fontSize: 22, bgcolor: deck.color + "22",
//               border: `1px solid ${deck.color}44`,
//             }}>{deck.icon}</Box>
//             <Box>
//               <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>{deck.name}</Typography>
//               {!compact && deck.description && (
//                 <Typography variant="caption" sx={{ color: "text.secondary" }}>{deck.description}</Typography>
//               )}
//             </Box>
//           </Box>
//           {(onEdit || onDelete) && (
//             <>
//               <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}>
//                 <MoreVertIcon fontSize="small" />
//               </IconButton>
//               <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
//                 <MenuItem onClick={() => { onEdit?.(deck); setMenuAnchor(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} />Edit</MenuItem>
//                 <MenuItem onClick={() => { onDelete?.(deck._id); setMenuAnchor(null); }} sx={{ color: "error.main" }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} />Hapus</MenuItem>
//               </Menu>
//             </>
//           )}
//         </Box>

//         <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
//           <Chip size="small" label={`${deck.cardCount} kartu`} sx={{ bgcolor: "rgba(255,255,255,0.06)", fontSize: 11 }} />
//           {deck.dueCount > 0 && (
//             <Chip size="small" label={`${deck.dueCount} due`} sx={{ bgcolor: "#ef444420", color: "#f87171", fontSize: 11 }} />
//           )}
//           {deck.newCount > 0 && (
//             <Chip size="small" label={`${deck.newCount} baru`} sx={{ bgcolor: "#6366f120", color: "#a5b4fc", fontSize: 11 }} />
//           )}
//         </Box>

//         {/* Progress */}
//         <Box sx={{ mb: 2 }}>
//           <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
//             <Typography variant="caption" sx={{ color: "text.secondary" }}>Penguasaan</Typography>
//             <Typography variant="caption" sx={{ color: "text.secondary" }}>
//               {Math.round(((deck.cardCount - deck.dueCount - deck.newCount) / deck.cardCount) * 100)}%
//             </Typography>
//           </Box>
//           <LinearProgress
//             variant="determinate"
//             value={((deck.cardCount - deck.dueCount - deck.newCount) / deck.cardCount) * 100}
//             sx={{
//               height: 6, borderRadius: 3,
//               bgcolor: "rgba(255,255,255,0.06)",
//               "& .MuiLinearProgress-bar": { bgcolor: deck.color, borderRadius: 3 }
//             }}
//           />
//         </Box>

//         <Button
//           fullWidth variant="contained" size="small" startIcon={<StudyIcon />}
//           disabled={deck.dueCount === 0 && deck.newCount === 0}
//           onClick={() => onStudy(deck._id)}
//           sx={{
//             bgcolor: deck.color + "33", color: deck.color,
//             border: `1px solid ${deck.color}44`,
//             "&:hover": { bgcolor: deck.color + "55" },
//             "&:disabled": { opacity: 0.4 },
//           }}
//         >
//           {deck.dueCount > 0 || deck.newCount > 0 ? `Belajar (${deck.dueCount + deck.newCount})` : "Semua Selesai ✓"}
//         </Button>
//       </CardContent>
//     </Card>
//   );
// }

// // ---------- Decks Page ----------
// function DecksPage({ onStudy }: { onStudy: (id: string) => void }) {
//   const [decks, setDecks] = useState<Deck[]>(mockDecks);
//   const [addDialogOpen, setAddDialogOpen] = useState(false);
//   const [editDeck, setEditDeck] = useState<Deck | null>(null);
//   const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
//   const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
//   const [addCardOpen, setAddCardOpen] = useState(false);
//   const [editCard, setEditCard] = useState<Flashcard | null>(null);
//   const [search, setSearch] = useState("");
//   const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

//   const [newDeck, setNewDeck] = useState({ name: "", description: "", color: DECK_COLORS[0], icon: DECK_ICONS[0] });
//   const [newCard, setNewCard] = useState({ front: "", back: "", hint: "", tags: "" });

//   const showSnack = (msg: string, severity: "success" | "error" = "success") => setSnack({ open: true, msg, severity });

//   const handleAddDeck = () => {
//     if (!newDeck.name.trim()) return;
//     const deck: Deck = {
//       _id: `d${Date.now()}`, ...newDeck, cardCount: 0, dueCount: 0, newCount: 0, createdAt: new Date()
//     };
//     setDecks(prev => [...prev, deck]);
//     setNewDeck({ name: "", description: "", color: DECK_COLORS[0], icon: DECK_ICONS[0] });
//     setAddDialogOpen(false);
//     showSnack("Deck berhasil dibuat!");
//   };

//   const handleDeleteDeck = (id: string) => {
//     setDecks(prev => prev.filter(d => d._id !== id));
//     showSnack("Deck dihapus.");
//   };

//   const handleSelectDeck = (deck: Deck) => {
//     setSelectedDeck(deck);
//     setDeckCards(mockCards.filter(c => c.deckId === deck._id));
//   };

//   const handleAddCard = () => {
//     if (!newCard.front.trim() || !newCard.back.trim() || !selectedDeck) return;
//     const card = createMockCard(
//       `c${Date.now()}`, newCard.front, newCard.back, selectedDeck._id,
//       newCard.hint, newCard.tags.split(",").map(t => t.trim()).filter(Boolean)
//     );
//     setDeckCards(prev => [...prev, card]);
//     setDecks(prev => prev.map(d => d._id === selectedDeck._id ? { ...d, cardCount: d.cardCount + 1, newCount: d.newCount + 1 } : d));
//     setNewCard({ front: "", back: "", hint: "", tags: "" });
//     setAddCardOpen(false);
//     showSnack("Kartu ditambahkan!");
//   };

//   const handleDeleteCard = (id: string) => {
//     setDeckCards(prev => prev.filter(c => c._id !== id));
//     if (selectedDeck) setDecks(prev => prev.map(d => d._id === selectedDeck._id ? { ...d, cardCount: Math.max(0, d.cardCount - 1) } : d));
//     showSnack("Kartu dihapus.");
//   };

//   const filteredCards = deckCards.filter(c =>
//     c.front.toLowerCase().includes(search.toLowerCase()) || c.back.toLowerCase().includes(search.toLowerCase())
//   );

//   if (selectedDeck) {
//     return (
//       <Box>
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
//           <IconButton onClick={() => setSelectedDeck(null)}><BackIcon /></IconButton>
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedDeck.icon} {selectedDeck.name}</Typography>
//             <Typography variant="caption" sx={{ color: "text.secondary" }}>{selectedDeck.description}</Typography>
//           </Box>
//           <Button variant="contained" startIcon={<StudyIcon />} onClick={() => onStudy(selectedDeck._id)}>Belajar</Button>
//           <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddCardOpen(true)}>Tambah Kartu</Button>
//         </Box>

//         {/* Search */}
//         <TextField
//           fullWidth placeholder="Cari kartu..." size="small" value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           slotProps={{
//             input: {
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon
//                     sx={{
//                       color: "text.secondary",
//                       fontSize: 20,
//                     }}
//                   />
//                 </InputAdornment>
//               ),
//             },
//           }}
//           sx={{
//             mb: 3,
//             "& .MuiOutlinedInput-root": {
//               borderRadius: 3,
//             },
//           }}
//         // sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
//         />

//         {filteredCards.length === 0 ? (
//           <Box sx={{ textAlign: "center", py: 8 }}>
//             <Typography variant="h4" sx={{ mb: 1 }}>📭</Typography>
//             <Typography sx={{ color: "text.secondary" }}>Belum ada kartu di deck ini</Typography>
//             <Button sx={{ mt: 2 }} variant="contained" startIcon={<AddIcon />} onClick={() => setAddCardOpen(true)}>Tambah Kartu Pertama</Button>
//           </Box>
//         ) : (
//           <Grid container spacing={2}>
//             {filteredCards.map(card => (
//               <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card._id}>
//                 <Card sx={{ height: "100%", p: 2 }}>
//                   <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
//                     <Chip size="small" label={card.fsrs.state} sx={{
//                       bgcolor: card.fsrs.state === "new" ? "#6366f120" : card.fsrs.state === "review" ? "#10b98120" : "#f59e0b20",
//                       color: card.fsrs.state === "new" ? "#a5b4fc" : card.fsrs.state === "review" ? "#34d399" : "#fbbf24",
//                       fontSize: 10,
//                     }} />
//                     <Box>
//                       <IconButton size="small" onClick={() => setEditCard(card)}><EditIcon fontSize="small" /></IconButton>
//                       <IconButton size="small" onClick={() => handleDeleteCard(card._id)} sx={{ color: "error.main" }}><DeleteIcon fontSize="small" /></IconButton>
//                     </Box>
//                   </Box>
//                   <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>{card.front}</Typography>
//                   <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 12, mb: 1 }}>
//                     {card.back.substring(0, 80)}{card.back.length > 80 ? "..." : ""}
//                   </Typography>
//                   <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
//                     {card.tags.map(tag => <Chip key={tag} label={tag} size="small" sx={{ fontSize: 10, height: 20 }} />)}
//                   </Box>
//                   <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
//                     Due: {new Date(card.fsrs.due).toLocaleDateString("id-ID")}
//                   </Typography>
//                 </Card>
//               </Grid>
//             ))}
//           </Grid>
//         )}

//         {/* Add Card Dialog */}
//         <Dialog open={addCardOpen} onClose={() => setAddCardOpen(false)} maxWidth="sm" fullWidth>
//           <DialogTitle sx={{ fontWeight: 700 }}>Tambah Kartu Baru</DialogTitle>
//           <DialogContent sx={{ pt: 2 }}>
//             <TextField fullWidth label="Depan (pertanyaan)" multiline rows={3} value={newCard.front} onChange={e => setNewCard(p => ({ ...p, front: e.target.value }))} sx={{ mb: 2 }} />
//             <TextField fullWidth label="Belakang (jawaban)" multiline rows={4} value={newCard.back} onChange={e => setNewCard(p => ({ ...p, back: e.target.value }))} sx={{ mb: 2 }} />
//             <TextField fullWidth label="Petunjuk (opsional)" value={newCard.hint} onChange={e => setNewCard(p => ({ ...p, hint: e.target.value }))} sx={{ mb: 2 }} />
//             <TextField fullWidth label="Tag (pisahkan dengan koma)" value={newCard.tags} onChange={e => setNewCard(p => ({ ...p, tags: e.target.value }))} />
//           </DialogContent>
//           <DialogActions sx={{ p: 2 }}>
//             <Button onClick={() => setAddCardOpen(false)}>Batal</Button>
//             <Button variant="contained" onClick={handleAddCard}>Tambah</Button>
//           </DialogActions>
//         </Dialog>

//         <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))}>
//           <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
//         </Snackbar>
//       </Box>
//     );
//   }

//   return (
//     <Box>
//       <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
//         <Box>
//           <Typography variant="h4" sx={{ fontWeight: 800 }}>Daftar Deck</Typography>
//           <Typography sx={{ color: "text.secondary", mt: 0.5 }}>{decks.length} deck tersimpan</Typography>
//         </Box>
//         <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>Buat Deck</Button>
//       </Box>

//       <Grid container spacing={2}>
//         {decks.map(deck => (
//           <Grid size={{ xs: 12, sm: 6, md: 4 }} key={deck._id}>
//             <Box onClick={() => handleSelectDeck(deck)} sx={{ cursor: "pointer" }}>
//               <DeckCard deck={deck} onStudy={onStudy}
//                 onEdit={(d) => setEditDeck(d)}
//                 onDelete={handleDeleteDeck}
//               />
//             </Box>
//           </Grid>
//         ))}
//         <Grid size={{ xs: 12, sm: 6, md: 4 }}>
//           <Card sx={{
//             height: "100%", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center",
//             cursor: "pointer", border: "2px dashed rgba(255,255,255,0.1)",
//             transition: "all 0.2s",
//             "&:hover": { borderColor: "primary.main", bgcolor: "rgba(129,140,248,0.05)" }
//           }} onClick={() => setAddDialogOpen(true)}>
//             <Box sx={{ textAlign: "center" }}>
//               <AddIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
//               <Typography sx={{ color: "text.secondary" }}>Buat Deck Baru</Typography>
//             </Box>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Add Deck Dialog */}
//       <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700 }}>Buat Deck Baru</DialogTitle>
//         <DialogContent sx={{ pt: 2 }}>
//           <TextField fullWidth label="Nama Deck" value={newDeck.name} onChange={e => setNewDeck(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />
//           <TextField fullWidth label="Deskripsi (opsional)" value={newDeck.description} onChange={e => setNewDeck(p => ({ ...p, description: e.target.value }))} sx={{ mb: 2 }} />
//           <Typography variant="subtitle2" sx={{ mb: 1 }}>Warna</Typography>
//           <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
//             {DECK_COLORS.map(c => (
//               <Box key={c} onClick={() => setNewDeck(p => ({ ...p, color: c }))} sx={{
//                 width: 32, height: 32, borderRadius: "50%", bgcolor: c, cursor: "pointer",
//                 border: newDeck.color === c ? "3px solid white" : "3px solid transparent", transition: "all 0.15s"
//               }} />
//             ))}
//           </Box>
//           <Typography variant="subtitle2" sx={{ mb: 1 }}>Ikon</Typography>
//           <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
//             {DECK_ICONS.map(ic => (
//               <Box key={ic} onClick={() => setNewDeck(p => ({ ...p, icon: ic }))} sx={{
//                 width: 40, height: 40, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
//                 fontSize: 20, cursor: "pointer",
//                 bgcolor: newDeck.icon === ic ? "primary.main" + "33" : "rgba(255,255,255,0.05)",
//                 border: newDeck.icon === ic ? "2px solid" : "2px solid transparent",
//                 borderColor: newDeck.icon === ic ? "primary.main" : "transparent",
//               }}>{ic}</Box>
//             ))}
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ p: 2 }}>
//           <Button onClick={() => setAddDialogOpen(false)}>Batal</Button>
//           <Button variant="contained" onClick={handleAddDeck}>Buat</Button>
//         </DialogActions>
//       </Dialog>

//       <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))}>
//         <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
//       </Snackbar>
//     </Box>
//   );
// }

// // ---------- Stats Page ----------
// function StatsPage() {
//   const barData = [
//     { day: "Sen", count: 18 }, { day: "Sel", count: 25 }, { day: "Rab", count: 12 },
//     { day: "Kam", count: 30 }, { day: "Jum", count: 22 }, { day: "Sab", count: 8 }, { day: "Min", count: 24 },
//   ];
//   const maxBar = Math.max(...barData.map(b => b.count));

//   return (
//     <Box>
//       <Typography variant="h4" sx={{ mb: 3, fontWeight: 800 }}>Statistik Belajar</Typography>

//       <Grid container spacing={2} sx={{ mb: 3 }}>
//         {[
//           { icon: <FireIcon />, label: "Streak", value: `${mockStats.streak} hari`, color: "#f97316" },
//           { icon: <CheckIcon />, label: "Hari Ini", value: mockStats.todayReviews, color: "#34d399", sublabel: "review selesai" },
//           { icon: <TrendingUpIcon />, label: "Akurasi", value: `${mockStats.accuracy}%`, color: "#818cf8" },
//           { icon: <TrophyIcon />, label: "Total Review", value: mockStats.totalReviews, color: "#f59e0b" },
//         ].map((s, i) => (
//           <Grid size={{ xs: 6, md: 3 }} key={i}>
//             <StatCard {...s} />
//           </Grid>
//         ))}
//       </Grid>

//       {/* Weekly chart */}
//       <Card sx={{ p: 3, mb: 3 }}>
//         <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Review 7 Hari Terakhir</Typography>
//         <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 140 }}>
//           {barData.map((b) => (
//             <Box key={b.day} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
//               <Typography variant="caption" sx={{ color: "text.secondary" }}>{b.count}</Typography>
//               <Box sx={{
//                 width: "100%", bgcolor: "#818cf8",
//                 height: `${(b.count / maxBar) * 100}%`,
//                 borderRadius: "6px 6px 0 0",
//                 minHeight: 8,
//                 opacity: b.day === "Min" ? 1 : 0.6,
//                 transition: "all 0.3s",
//                 "&:hover": { opacity: 1 },
//               }} />
//               <Typography variant="caption" sx={{ color: "text.secondary" }}>{b.day}</Typography>
//             </Box>
//           ))}
//         </Box>
//       </Card>

//       {/* Card states */}
//       <Card sx={{ p: 3 }}>
//         <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Distribusi Kartu</Typography>
//         <Grid container spacing={2}>
//           {[
//             { label: "Baru", count: 26, color: "#818cf8", pct: 16 },
//             { label: "Belajar", count: 18, color: "#fbbf24", pct: 11 },
//             { label: "Review", count: 89, color: "#34d399", pct: 54 },
//             { label: "Dikuasai", count: 32, color: "#06b6d4", pct: 19 },
//           ].map((item) => (
//             <Grid size={{ xs: 6, md: 3 }} key={item.label}>
//               <Box sx={{ textAlign: "center", p: 2, borderRadius: 3, bgcolor: item.color + "15", border: `1px solid ${item.color}30` }}>
//                 <Typography variant="h4" sx={{ fontWeight: 800, color: item.color }}>{item.count}</Typography>
//                 <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
//                 <Typography variant="caption" sx={{ color: "text.secondary" }}>{item.pct}%</Typography>
//               </Box>
//             </Grid>
//           ))}
//         </Grid>
//       </Card>
//     </Box>
//   );
// }

// // ---------- Study Session ----------
// type StudyPhase = "intro" | "question" | "answer" | "done";

// const RATING_CONFIG = [
//   { rating: 1 as Rating, label: "Lagi", sublabel: "< 10 mnt", color: "#f87171", key: "1" },
//   { rating: 2 as Rating, label: "Sulit", sublabel: "beberapa hari", color: "#fbbf24", key: "2" },
//   { rating: 3 as Rating, label: "Bagus", sublabel: "4 hari", color: "#34d399", key: "3" },
//   { rating: 4 as Rating, label: "Mudah", sublabel: "9 hari", color: "#818cf8", key: "4" },
// ];

// function StudySession({ deckId, onFinish }: { deckId: string; onFinish: () => void }) {
//   const cards = deckId === "all"
//     ? mockCards
//     : mockCards.filter(c => c.deckId === deckId);

//   const [queue, setQueue] = useState<Flashcard[]>([...cards]);
//   const [current, setCurrent] = useState<Flashcard | null>(cards[0] || null);
//   const [phase, setPhase] = useState<StudyPhase>(cards.length ? "question" : "done");
//   const [flipped, setFlipped] = useState(false);
//   const [showHint, setShowHint] = useState(false);
//   const [reviewed, setReviewed] = useState(0);
//   const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });

//   const progress = reviewed / (reviewed + queue.length) * 100;

//   const handleFlip = () => setFlipped(true);

//   const handleRate = (rating: Rating) => {
//     if (!current) return;
//     const updated = scheduleFSRS(current.fsrs, rating);
//     console.log("FSRS scheduled:", updated);

//     setRatingCounts(prev => ({ ...prev, [rating]: prev[rating as keyof typeof prev] + 1 }));
//     setReviewed(r => r + 1);

//     const remaining = queue.filter(c => c._id !== current._id);

//     // If again, re-queue this card
//     const newQueue = rating === 1 ? [...remaining.slice(0, 2), { ...current, fsrs: updated }, ...remaining.slice(2)] : remaining;

//     if (newQueue.length === 0) {
//       setPhase("done");
//     } else {
//       setCurrent(newQueue[0]);
//       setQueue(newQueue);
//       setFlipped(false);
//       setShowHint(false);
//     }
//   };

//   if (phase === "done") {
//     const accuracy = reviewed > 0 ? Math.round(((ratingCounts[3] + ratingCounts[4]) / reviewed) * 100) : 0;
//     return (
//       <Box sx={{ textAlign: "center", py: 6 }}>
//         <Typography variant="h2" sx={{ mb: 1 }}>🎉</Typography>
//         <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Sesi Selesai!</Typography>
//         <Typography sx={{ color: "text.secondary", mb: 4 }}>Kerja bagus! Kamu telah menyelesaikan sesi belajar hari ini.</Typography>

//         <Grid container spacing={2} sx={{ maxWidth: 480, mx: "auto", mb: 4 }}>
//           <Grid size={{ xs: 6 }}>
//             <Card sx={{ p: 2 }}>
//               <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.light" }}>{reviewed}</Typography>
//               <Typography variant="body2" sx={{ color: "text.secondary" }}>Kartu Diulas</Typography>
//             </Card>
//           </Grid>
//           <Grid size={{ xs: 6 }}>
//             <Card sx={{ p: 2 }}>
//               <Typography variant="h4" sx={{ fontWeight: 800, color: "secondary.main" }}>{accuracy}%</Typography>
//               <Typography variant="body2" sx={{ color: "text.secondary" }}>Akurasi</Typography>
//             </Card>
//           </Grid>
//           {RATING_CONFIG.map(r => (
//             <Grid size={{ xs: 3 }} key={r.rating}>
//               <Card sx={{ p: 1.5, bgcolor: r.color + "15" }}>
//                 <Typography variant="h5" sx={{ fontWeight: 800, color: r.color }}>{ratingCounts[r.rating]}</Typography>
//                 <Typography variant="caption" sx={{ color: "text.secondary" }}>{r.label}</Typography>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>

//         <Button variant="contained" size="large" onClick={onFinish}>Kembali ke Dashboard</Button>
//       </Box>
//     );
//   }

//   if (!current) return null;

//   return (
//     <Box sx={{ maxWidth: 640, mx: "auto" }}>
//       {/* Header */}
//       <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
//         <IconButton onClick={onFinish}><BackIcon /></IconButton>
//         <Box sx={{ flex: 1, mx: 2 }}>
//           <LinearProgress variant="determinate" value={progress}
//             sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.06)", "& .MuiLinearProgress-bar": { bgcolor: "primary.main", borderRadius: 4 } }} />
//           <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5, textAlign: "center" }}>
//             {reviewed} / {reviewed + queue.length} kartu
//           </Typography>
//         </Box>
//         <Chip size="small" label={current.fsrs.state}
//           sx={{
//             bgcolor: current.fsrs.state === "new" ? "#6366f120" : "#10b98120",
//             color: current.fsrs.state === "new" ? "#a5b4fc" : "#34d399",
//           }} />
//       </Box>

//       {/* Card */}
//       <Box sx={{
//         perspective: "1000px",
//         mb: 3,
//       }}>
//         <Box sx={{
//           position: "relative",
//           transformStyle: "preserve-3d",
//           transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
//           transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
//           minHeight: 280,
//         }}>
//           {/* Front */}
//           <Card sx={{
//             position: flipped ? "absolute" : "relative",
//             width: "100%", p: 4,
//             backfaceVisibility: "hidden",
//             WebkitBackfaceVisibility: "hidden",
//             minHeight: 280,
//             display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
//             background: "linear-gradient(135deg, #111827, #1e2940)",
//           }}>
//             <Typography variant="caption" sx={{ color: "text.secondary", mb: 2, textTransform: "uppercase", letterSpacing: 1 }}>Pertanyaan</Typography>
//             <Typography variant="h5" sx={{ textAlign: "center", lineHeight: 1.4, fontWeight: 700 }}>{current.front}</Typography>
//             {current.tags.length > 0 && (
//               <Box sx={{ display: "flex", gap: 0.5, mt: 2, flexWrap: "wrap", justifyContent: "center" }}>
//                 {current.tags.map(t => <Chip key={t} label={t} size="small" sx={{ fontSize: 10, height: 20 }} />)}
//               </Box>
//             )}
//           </Card>

//           {/* Back */}
//           <Card sx={{
//             position: "absolute", top: 0, left: 0, width: "100%", p: 4,
//             backfaceVisibility: "hidden",
//             WebkitBackfaceVisibility: "hidden",
//             transform: "rotateY(180deg)",
//             minHeight: 280,
//             display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
//             background: "linear-gradient(135deg, #1a1f3a, #111827)",
//             border: "1px solid rgba(129,140,248,0.2)",
//           }}>
//             <Typography variant="caption" sx={{ color: "primary.light", mb: 2, textTransform: "uppercase", letterSpacing: 1 }}>Jawaban</Typography>
//             <Typography variant="body1" sx={{ textAlign: "center", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{current.back}</Typography>
//           </Card>
//         </Box>
//       </Box>

//       {/* Hint */}
//       {current.hint && !flipped && (
//         <Collapse in={showHint}>
//           <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
//             <Typography variant="body2"><strong>Petunjuk:</strong> {current.hint}</Typography>
//           </Alert>
//         </Collapse>
//       )}

//       {/* Actions */}
//       {!flipped ? (
//         <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
//           {current.hint && (
//             <Button variant="outlined" startIcon={<HintIcon />} onClick={() => setShowHint(s => !s)} sx={{ borderRadius: 3 }}>
//               {showHint ? "Sembunyikan" : "Petunjuk"}
//             </Button>
//           )}
//           <Button variant="contained" size="large" startIcon={<FlipIcon />} onClick={handleFlip}
//             sx={{ px: 4, borderRadius: 3, background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
//             Tampilkan Jawaban
//           </Button>
//         </Box>
//       ) : (
//         <Box>
//           <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mb: 2 }}>Seberapa mudah kamu mengingat ini?</Typography>
//           <Grid container spacing={1.5}>
//             {RATING_CONFIG.map(r => (
//               <Grid size={{ xs: 3 }} key={r.rating}>
//                 <Button
//                   fullWidth variant="contained" onClick={() => handleRate(r.rating)}
//                   sx={{
//                     bgcolor: r.color + "22", color: r.color,
//                     border: `1px solid ${r.color}44`,
//                     "&:hover": { bgcolor: r.color + "44" },
//                     flexDirection: "column", py: 1.5, gap: 0.25,
//                   }}
//                 >
//                   <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.label}</Typography>
//                   <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 10 }}>{r.sublabel}</Typography>
//                 </Button>
//               </Grid>
//             ))}
//           </Grid>
//           <Typography variant="caption" sx={{ color: "text.secondary", display: "block", textAlign: "center", mt: 1.5 }}>
//             Tekan <strong>1</strong> Lagi · <strong>2</strong> Sulit · <strong>3</strong> Bagus · <strong>4</strong> Mudah
//           </Typography>
//         </Box>
//       )}
//     </Box>
//   );
// }

// // ============================================================
// // MAIN APP
// // ============================================================

// export default function App() {
//   const [page, setPage] = useState<"dashboard" | "decks" | "stats" | "study">("dashboard");
//   const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const isMobile = useMediaQuery(theme.breakpoints.down("md"));

//   // Keyboard shortcut for ratings during study
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (page !== "study") return;
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [page]);

//   const handleStudy = (deckId: string) => {
//     setStudyDeckId(deckId);
//     setPage("study");
//   };

//   const handleFinishStudy = () => {
//     setStudyDeckId(null);
//     setPage("dashboard");
//   };

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       {/* Google Fonts */}
//       <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

//       <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
//         {/* Sidebar */}
//         {page !== "study" && (
//           <Sidebar
//             open={sidebarOpen}
//             onClose={() => setSidebarOpen(false)}
//             activePage={page}
//             onNavigate={(p) => setPage(p as any)}
//           />
//         )}

//         {/* Main content */}
//         <Box sx={{
//           flex: 1,
//           ml: page !== "study" && !isMobile ? `${SIDEBAR_WIDTH}px` : 0,
//           minHeight: "100vh",
//         }}>
//           {/* Top bar (mobile) */}
//           {page !== "study" && isMobile && (
//             <Box sx={{
//               position: "sticky", top: 0, zIndex: 1100,
//               bgcolor: "background.default", borderBottom: "1px solid rgba(255,255,255,0.06)",
//               px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5,
//             }}>
//               <IconButton onClick={() => setSidebarOpen(true)}><MenuIcon /></IconButton>
//               <Typography variant="h6" sx={{ fontWeight: 700 }}>🧠 HafalCepat</Typography>
//             </Box>
//           )}

//           <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
//             {page === "dashboard" && <Dashboard onStudy={handleStudy} onNavigate={(p) => setPage(p as any)} />}
//             {page === "decks" && <DecksPage onStudy={handleStudy} />}
//             {page === "stats" && <StatsPage />}
//             {page === "study" && studyDeckId && <StudySession deckId={studyDeckId} onFinish={handleFinishStudy} />}
//           </Container>
//         </Box>
//       </Box>
//     </ThemeProvider>
//   );
// }

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
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: "primary.main" }}>🧠 HafalCepat</Typography>
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
              <Typography sx={{ fontWeight: 700, color: "primary.main", fontSize: 15 }}>🧠 HafalCepat</Typography>
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