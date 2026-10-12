import Feather from "@react-native-vector-icons/feather";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LeafletMap from "@/src/components/LeafletMap";
import { PatchSheet } from "@/src/components/PatchSheet";
import { CURRENT_YEAR, PATCHES, STATS, type Patch } from "@/src/data/vegetation";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useState } from "react";

const EMPTY: never[] = [];

export default function CompareScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [patch, setPatch] = useState<Patch | null>(null);
  const openPatch = (id: string) => setPatch(PATCHES.find((p) => p.id === id) ?? null);
  const before = STATS[0];
  const now = STATS[STATS.length - 1];

  return (
    <View style={styles.root} testID="compare-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="compare-back-btn" onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Antes x Agora</Text>
          <Text style={styles.sub}>Arborização da ilha: 1996 e hoje · toque nas manchas</Text>
        </View>
      </View>

      <View style={styles.mapBox}>
        <LeafletMap year={STATS[0].year} base="sat" reports={EMPTY} padTop={40} onPatch={openPatch} />
        <View style={styles.tag}>
          <Text style={styles.tagText} testID="compare-before-label">{before.year} · {before.coverage}% verde</Text>
        </View>
      </View>
      <View style={styles.mapBox}>
        <LeafletMap year={CURRENT_YEAR} base="sat" reports={EMPTY} padTop={40} onPatch={openPatch} />
        <View style={[styles.tag, styles.tagNow]}>
          <Text style={[styles.tagText, { color: colors.onError }]} testID="compare-now-label">
            Hoje · {now.coverage}% verde
          </Text>
        </View>
      </View>

      <View style={[styles.summary, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.summaryText} testID="compare-summary">
          A ilha perdeu cerca de {Math.round(((before.coverage - now.coverage) / before.coverage) * 100)}% da sua
          cobertura arbórea em 30 anos. Toque nas manchas para ver as causas.
        </Text>
        <Text style={styles.note}>Modelo educativo aproximado. Confira imagens reais no Google Earth Timelapse.</Text>
      </View>
      <PatchSheet patch={patch} onClose={() => setPatch(null)} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 24, color: c.onSurface },
  sub: { fontFamily: fonts.text, fontSize: 13, color: c.muted },
  mapBox: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.border,
  },
  tag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: c.brandPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagNow: { backgroundColor: c.error },
  tagText: { fontFamily: fonts.text, fontSize: 13, color: c.onBrandPrimary },
  summary: { paddingHorizontal: 16, paddingTop: 8 },
  summaryText: { fontFamily: fonts.text, fontSize: 14, color: c.onSurface, lineHeight: 20 },
  note: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: 4 },
}));
