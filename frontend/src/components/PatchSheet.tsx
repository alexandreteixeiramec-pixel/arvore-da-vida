import Feather from "@react-native-vector-icons/feather";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FAUNA, googleMapsUrl, patchLossPct, SAT_BEFORE, SAT_NOW, type Patch } from "@/src/data/vegetation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const Z = 17;
const TYPE_LABEL = { mata: "Mata", mangue: "Manguezal", restinga: "Restinga" };

// Real satellite crop (2x2 tiles) centred on the patch, with its 1996 outline.
function SatCrop({ patch, url, label, size, testID }: { patch: Patch; url: string; label: string; size: number; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [lat, lng] = patch.center;
  const n = 2 ** Z;
  const fx = ((lng + 180) / 360) * n;
  const latR = (lat * Math.PI) / 180;
  const fy = ((1 - Math.asinh(Math.tan(latR)) / Math.PI) / 2) * n;
  const x0 = Math.floor(fx - 0.5);
  const y0 = Math.floor(fy - 0.5);
  const tile = size / 2;
  const cx = (fx - x0) * tile;
  const cy = (fy - y0) * tile;
  const tileMeters = (40075016 * Math.cos(latR)) / n;
  const rPx = (patch.r[0] / tileMeters) * tile;
  const tiles = [0, 1].flatMap((dy) => [0, 1].map((dx) => ({ dx, dy })));

  return (
    <View style={[styles.crop, { width: size, height: size }]} testID={testID}>
      {tiles.map(({ dx, dy }) => (
        <Image
          key={`${dx}${dy}`}
          source={{ uri: url.replace("{z}", String(Z)).replace("{x}", String(x0 + dx)).replace("{y}", String(y0 + dy)) }}
          style={{ position: "absolute", left: dx * tile, top: dy * tile, width: tile, height: tile }}
          contentFit="cover"
          transition={200}
        />
      ))}
      <View
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: cx - rPx,
          top: cy - rPx,
          width: rPx * 2,
          height: rPx * 2,
          borderRadius: rPx,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: colors.warning,
        }}
      />
      <View style={styles.cropTag}>
        <Text style={styles.cropTagText}>{label}</Text>
      </View>
    </View>
  );
}

export function PatchSheet({ patch, onClose }: { patch: Patch | null; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);

  const loss = patch ? patchLossPct(patch) : 0;
  const cropSize = width ? (width - 8) / 2 : 0;
  const faunaGroups = patch?.type === "mangue" ? FAUNA.filter((f) => f.icon === "anchor" || f.migratory) : FAUNA.filter((f) => f.icon !== "anchor").slice(0, 4);

  return (
    <Modal visible={!!patch} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="patch-sheet-backdrop" />
      {patch && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="patch-sheet">
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
            <View style={styles.headRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.type}>{TYPE_LABEL[patch.type].toUpperCase()}</Text>
                <Text style={styles.name} testID="patch-sheet-name">{patch.name}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.close} testID="patch-sheet-close-btn" hitSlop={8}>
                <Feather name="x" size={22} color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.lossRow}>
              <View style={styles.lossBox}>
                <Text style={styles.lossNum} testID="patch-sheet-loss">{loss}%</Text>
                <Text style={styles.lossLabel}>da área perdida desde 1996</Text>
              </View>
              <View style={[styles.lossBox, { backgroundColor: colors.surfaceTertiary }]}>
                <Text style={[styles.lossLabel, { color: colors.onSurface }]}>Causa provável</Text>
                <Text style={styles.cause}>{patch.cause}</Text>
              </View>
            </View>

            <Text style={styles.section}>Antes x Depois (fotos reais de satélite)</Text>
            <View style={styles.crops} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
              {cropSize > 0 && (
                <>
                  <SatCrop patch={patch} url={SAT_BEFORE.url} label={SAT_BEFORE.label} size={cropSize} testID="patch-photo-before" />
                  <SatCrop patch={patch} url={SAT_NOW.url} label={SAT_NOW.label} size={cropSize} testID="patch-photo-after" />
                </>
              )}
            </View>
            <Text style={styles.note}>
              O círculo tracejado marca a mancha verde de 1996. Imagens: Esri World Imagery e arquivo histórico Wayback
              (o mais antigo disponível é de 2014).
            </Text>

            <Pressable
              style={styles.gmaps}
              onPress={() => WebBrowser.openBrowserAsync(googleMapsUrl(patch.center[0], patch.center[1]))}
              testID="patch-open-google-maps-btn"
            >
              <Feather name="map" size={16} color={colors.onBrandPrimary} />
              <Text style={styles.gmapsText}>Ver este local no Google Maps</Text>
            </Pressable>

            <Text style={styles.section}>Fauna afetada nesta área</Text>
            {faunaGroups.map((f) => {
              const pct = Math.round((f.lost * Math.max(loss, 15)) / 60);
              return (
                <View key={f.group} style={styles.faunaRow} testID={`patch-fauna-${f.icon}`}>
                  <View style={styles.faunaIcon}>
                    <Feather name={f.icon as any} size={16} color={colors.onBrandTertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.faunaName}>{f.group}</Text>
                    <Text style={styles.faunaEx}>{f.migratory ? "Mudaram a rota migratória" : f.examples}</Text>
                  </View>
                  <Text style={styles.faunaPct}>-{Math.min(pct, 90)}%</Text>
                </View>
              );
            })}
            <Text style={styles.note}>Estimativa educativa proporcional à perda de vegetação desta mancha.</Text>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  backdrop: { flex: 1, backgroundColor: "rgba(44,47,41,0.45)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 8 },
  headRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  type: { fontFamily: fonts.text, fontSize: 11, letterSpacing: 1.5, color: c.muted },
  name: { fontFamily: fonts.display, fontSize: 24, color: c.onSurface, marginTop: 2 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  lossRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  lossBox: { flex: 1, borderRadius: 12, padding: 12, backgroundColor: c.brandTertiary },
  lossNum: { fontFamily: fonts.display, fontSize: 28, color: c.error },
  lossLabel: { fontFamily: fonts.text, fontSize: 12, color: c.muted },
  cause: { fontFamily: fonts.text, fontSize: 14, color: c.onSurface, marginTop: 4, lineHeight: 19 },
  section: { fontFamily: fonts.display, fontSize: 17, color: c.onSurface, marginTop: 24, marginBottom: 8 },
  crops: { flexDirection: "row", gap: 8 },
  crop: { borderRadius: 12, overflow: "hidden", backgroundColor: c.surfaceTertiary },
  cropTag: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: c.surfaceInverse,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cropTagText: { fontFamily: fonts.text, fontSize: 11, color: c.onSurfaceInverse },
  note: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: 8, lineHeight: 16 },
  gmaps: {
    marginTop: 12,
    height: 48,
    borderRadius: 999,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  gmapsText: { fontFamily: fonts.text, fontSize: 15, color: c.onBrandPrimary },
  faunaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  faunaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  faunaName: { fontFamily: fonts.text, fontSize: 14, color: c.onSurface },
  faunaEx: { fontFamily: fonts.text, fontSize: 12, color: c.muted },
  faunaPct: { fontFamily: fonts.display, fontSize: 18, color: c.error },
}));
