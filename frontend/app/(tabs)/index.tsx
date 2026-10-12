import Feather from "@react-native-vector-icons/feather";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchReports } from "@/src/api";
import LeafletMap from "@/src/components/LeafletMap";
import { STATS, YEAR_STORY, YEARS, type Year } from "@/src/data/vegetation";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function MapScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const [year, setYear] = useState<Year>(2024);
  const [base, setBase] = useState<"sat" | "map">("sat");
  const [playing, setPlaying] = useState(false);
  const [command, setCommand] = useState<{ recenter?: boolean; n: number } | undefined>();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: reportsData } = useQuery({ queryKey: ["reports"], queryFn: fetchReports });
  const reports = useMemo(
    () =>
      (reportsData ?? []).map((r) => ({
        id: r.id,
        lat: r.latitude,
        lng: r.longitude,
        label: `${r.category}: ${r.description.slice(0, 80)}`,
      })),
    [reportsData],
  );

  const stat = STATS.find((s) => s.year === year)!;
  const lossVs94 = STATS[0].coverage - stat.coverage;

  const pick = (y: Year) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setYear(y);
  };

  useEffect(() => {
    if (!playing) return;
    setYear(YEARS[0]);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      if (i >= YEARS.length) {
        setPlaying(false);
        return;
      }
      setYear(YEARS[i]);
    }, 1600);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  return (
    <View style={styles.root} testID="map-screen">
      <LeafletMap year={year} base={base} reports={reports} command={command} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, { top: insets.top + 8 }]}>
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>MADRE DE DEUS · BAHIA</Text>
          <Text style={styles.title} testID="app-title">Madre: Árvore da Vida</Text>
        </View>
        <View style={styles.fabCol}>
          <Pressable
            testID="toggle-base-layer-btn"
            style={styles.fab}
            onPress={() => setBase((b) => (b === "sat" ? "map" : "sat"))}
          >
            <Feather name="layers" size={20} color={colors.onBrandSecondary} />
          </Pressable>
          <Pressable
            testID="recenter-map-btn"
            style={styles.fab}
            onPress={() => setCommand({ recenter: true, n: Date.now() })}
          >
            <Feather name="crosshair" size={20} color={colors.onBrandSecondary} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Timeline panel */}
      <Animated.View entering={FadeIn.delay(200)} style={[styles.panel, { bottom: bottomChrome + 16 }]}>
        <View style={styles.panelTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.yearBig} testID="selected-year">{year}</Text>
            <Text style={styles.story} numberOfLines={3} testID="year-story">{YEAR_STORY[year]}</Text>
          </View>
          <View style={styles.coverBox}>
            <Text style={styles.coverNum} testID="coverage-value">{stat.coverage}%</Text>
            <Text style={styles.coverLabel}>cobertura</Text>
            {lossVs94 > 0 && <Text style={styles.loss}>-{lossVs94} pts</Text>}
          </View>
        </View>

        <View style={styles.timeline}>
          <View style={styles.track} />
          {YEARS.map((y) => {
            const active = y === year;
            return (
              <Pressable key={y} testID={`year-${y}-btn`} onPress={() => pick(y)} style={styles.stop} hitSlop={8}>
                <View style={[styles.dot, active && styles.dotActive]} />
                <Text style={[styles.stopLabel, active && styles.stopLabelActive]}>
                  {y === 2024 ? "Hoje" : `${2024 - y} anos`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          <Legend color={colors.forest} label="Mata" />
          <Legend color={colors.mangrove} label="Mangue" />
          <Legend color={colors.lost} label="Perdido" dashed />
          <Legend color={colors.lost} label="Denúncia" round />
        </View>

        <View style={styles.actions}>
          <Pressable testID="play-timeline-btn" style={styles.btnGhost} onPress={() => setPlaying((p) => !p)}>
            <Feather name={playing ? "pause" : "play"} size={16} color={colors.brandPrimary} />
            <Text style={styles.btnGhostText}>{playing ? "Pausar" : "Animar 30 anos"}</Text>
          </Pressable>
          <Pressable testID="open-compare-btn" style={styles.btn} onPress={() => router.push("/comparar")}>
            <Feather name="columns" size={16} color={colors.onBrandPrimary} />
            <Text style={styles.btnText}>Antes x Agora</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function Legend({ color, label, dashed, round }: { color: string; label: string; dashed?: boolean; round?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.legend}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: dashed ? "transparent" : color, borderColor: color },
          dashed && { borderStyle: "dashed", borderWidth: 1.5 },
          round && { borderRadius: 6 },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  headerCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  kicker: { fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.5, color: c.muted },
  title: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface, marginTop: 2 },
  fabCol: { gap: 8 },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  panelTop: { flexDirection: "row", gap: 12 },
  yearBig: { fontFamily: fonts.display, fontSize: 34, color: c.brandPrimary, lineHeight: 38 },
  story: { fontFamily: fonts.text, fontSize: 13, color: c.onSurfaceSecondary, marginTop: 4, lineHeight: 18 },
  coverBox: {
    width: 84,
    backgroundColor: c.brandTertiary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  coverNum: { fontFamily: fonts.display, fontSize: 24, color: c.onBrandTertiary },
  coverLabel: { fontFamily: fonts.text, fontSize: 11, color: c.muted },
  loss: { fontFamily: fonts.text, fontSize: 11, color: c.error, marginTop: 2 },
  timeline: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, height: 48 },
  track: { position: "absolute", left: 24, right: 24, top: 9, height: 2, backgroundColor: c.border },
  stop: { alignItems: "center", width: 64, minHeight: 44 },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.surface, borderWidth: 2, borderColor: c.borderStrong },
  dotActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  stopLabel: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 6 },
  stopLabelActive: { color: c.brandPrimary },
  legendRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
  legendText: { fontFamily: fonts.text, fontSize: 11, color: c.onSurfaceSecondary },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnText: { fontFamily: fonts.text, fontSize: 14, color: c.onBrandPrimary },
  btnGhost: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnGhostText: { fontFamily: fonts.text, fontSize: 14, color: c.brandPrimary },
}));
