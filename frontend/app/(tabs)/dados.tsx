import Feather from "@react-native-vector-icons/feather";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Polyline, Line } from "react-native-svg";

import { CURRENT_YEAR, FAUNA, SOURCES, STATS, TIPS } from "@/src/data/vegetation";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200";

export default function DataScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const first = STATS[0];
  const last = STATS[STATS.length - 1];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: bottomChrome + 24 }}
      testID="data-screen"
    >
      <View style={styles.hero}>
        <Image source={{ uri: HERO }} style={StyleSheetAbs} contentFit="cover" transition={300} />
        <LinearGradient
          colors={["transparent", "rgba(44,47,41,0.2)", colors.scrim]}
          style={StyleSheetAbs}
        />
        <View style={[styles.heroText, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.heroKicker}>30 ANOS DE MUDANÇA</Text>
          <Text style={styles.heroTitle}>O verde que{"\n"}a ilha perdeu</Text>
        </View>
      </View>

      <View style={styles.kpis}>
        <Kpi testID="kpi-coverage" value={`-${first.coverage - last.coverage}`} unit="pts" label="cobertura verde" />
        <Kpi testID="kpi-mangrove" value={`-${first.mangroveHa - last.mangroveHa}`} unit="ha" label="de manguezal" />
        <Kpi testID="kpi-temp" value={`+${(last.surfaceTemp - first.surfaceTemp).toFixed(1)}`} unit="°C" label="na superfície" />
      </View>

      <Card title="Cobertura arbórea da ilha (%)" delay={100} testID="chart-coverage">
        <View style={styles.bars}>
          {STATS.map((s) => (
            <View key={s.year} style={styles.barCol}>
              <Text style={styles.barVal}>{s.coverage}%</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${s.coverage}%`, backgroundColor: s.year === CURRENT_YEAR ? colors.error : colors.brandPrimary },
                  ]}
                />
              </View>
              <Text style={styles.barYear}>{s.year}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card title="Qualidade do ar: partículas PM10 (µg/m³)" delay={200} testID="chart-air">
        <LineChart values={STATS.map((s) => s.pm10)} labels={STATS.map((s) => String(s.year))} limit={45} />
        <Text style={styles.cardNote}>
          Linha tracejada: 45 µg/m³, referência anual da OMS (2021). Menos árvores = menos filtro natural de poeira e
          poluentes do tráfego e da atividade petroleira.
        </Text>
      </Card>

      <Card title="Árvores por habitante" delay={300} testID="chart-trees">
        {STATS.map((s) => (
          <View key={s.year} style={styles.treeRow}>
            <Text style={styles.treeYear}>{s.year}</Text>
            <View style={styles.treeIcons}>
              {Array.from({ length: Math.round(s.treesPerPerson * 4) }).map((_, i) => (
                <Feather key={i} name="feather" size={14} color={colors.brandSecondary} />
              ))}
            </View>
            <Text style={styles.treeVal}>{s.treesPerPerson.toFixed(1)}</Text>
          </View>
        ))}
        <Text style={styles.cardNote}>População cresceu de ~{first.population / 1000} mil para ~{last.population / 1000} mil habitantes.</Text>
      </Card>

      <Card title="Fauna que sumiu da ilha" delay={350} testID="chart-fauna">
        <View style={styles.faunaIdx}>
          <View style={styles.faunaIdxBox} testID="fauna-bird-index">
            <Text style={styles.faunaIdxNum}>-{100 - last.birdIndex}%</Text>
            <Text style={styles.faunaIdxLabel}>espécies de aves avistadas</Text>
          </View>
          <View style={styles.faunaIdxBox} testID="fauna-insect-index">
            <Text style={styles.faunaIdxNum}>-{100 - last.insectIndex}%</Text>
            <Text style={styles.faunaIdxLabel}>insetos polinizadores</Text>
          </View>
        </View>
        {FAUNA.map((f, i) => (
          <View key={f.group} style={styles.faunaRow} testID={`fauna-row-${i}`}>
            <View style={styles.faunaHead}>
              <Feather name={f.icon as any} size={14} color={colors.brandPrimary} />
              <Text style={styles.faunaName}>{f.group}</Text>
              {f.migratory && (
                <View style={styles.migBadge}>
                  <Text style={styles.migText}>rota alterada</Text>
                </View>
              )}
              <Text style={styles.faunaPct}>-{f.lost}%</Text>
            </View>
            <View style={styles.faunaTrack}>
              <View style={[styles.faunaFill, { width: `${f.lost}%` }]} />
            </View>
            <Text style={styles.faunaEx}>{f.examples} · {f.effect}</Text>
          </View>
        ))}
        <Text style={styles.cardNote}>
          Estimativa educativa ({first.year}–{last.year}) baseada em estudos sobre fragmentação de matas e manguezais
          urbanos. Para registros reais de aves da região, consulte o WikiAves.
        </Text>
      </Card>

      <Text style={styles.section}>Como agir</Text>
      {TIPS.map((t, i) => (
        <Animated.View key={t.title} entering={FadeInDown.delay(100 + i * 60)} style={styles.tip} testID={`tip-${i}`}>
          <View style={styles.tipIcon}>
            <Feather name={t.icon as any} size={18} color={colors.onBrandTertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>{t.title}</Text>
            <Text style={styles.tipText}>{t.text}</Text>
          </View>
        </Animated.View>
      ))}

      <Text style={styles.section}>Fontes para o trabalho</Text>
      <View style={styles.sources}>
        {SOURCES.map((s, i) => (
          <Pressable
            key={s.url}
            testID={`source-link-${i}`}
            style={styles.source}
            onPress={() => WebBrowser.openBrowserAsync(s.url)}
          >
            <Text style={styles.sourceText}>{s.label}</Text>
            <Feather name="external-link" size={16} color={colors.brandPrimary} />
          </Pressable>
        ))}
        <Text style={styles.disclaimer}>
          Os números deste app são estimativas educativas baseadas em tendências de estudos sobre a Baía de Todos os
          Santos e o MapBiomas. Para o trabalho final, confirme os valores exatos nas fontes acima.
        </Text>
      </View>
    </ScrollView>
  );
}

const StyleSheetAbs = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

function Kpi({ value, unit, label, testID }: { value: string; unit: string; label: string; testID: string }) {
  const styles = useStyles();
  return (
    <View style={styles.kpi} testID={testID}>
      <Text style={styles.kpiVal}>
        {value}
        <Text style={styles.kpiUnit}> {unit}</Text>
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Card({ title, children, delay, testID }: { title: string; children: React.ReactNode; delay: number; testID: string }) {
  const styles = useStyles();
  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.card} testID={testID}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </Animated.View>
  );
}

function LineChart({ values, labels, limit }: { values: number[]; labels: string[]; limit: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const W = 300;
  const H = 120;
  const min = 20;
  const max = 50;
  const x = (i: number) => 20 + (i * (W - 40)) / (values.length - 1);
  const y = (v: number) => H - 10 - ((v - min) / (max - min)) * (H - 20);
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={0} x2={W} y1={y(limit)} y2={y(limit)} stroke={colors.error} strokeDasharray="4 4" strokeWidth={1} />
        <Polyline
          points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          fill="none"
          stroke={colors.warning}
          strokeWidth={3}
        />
        {values.map((v, i) => (
          <Circle key={i} cx={x(i)} cy={y(v)} r={5} fill={colors.surfaceSecondary} stroke={colors.warning} strokeWidth={2} />
        ))}
      </Svg>
      <View style={styles.lineLabels}>
        {labels.map((l, i) => (
          <Text key={l} style={styles.lineLabel}>
            {l}
            {"\n"}
            <Text style={styles.lineVal}>{values[i]}</Text>
          </Text>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { height: 260, justifyContent: "flex-end", overflow: "hidden" },
  heroText: { padding: 24 },
  heroKicker: { fontFamily: fonts.text, fontSize: 11, letterSpacing: 2, color: c.onSurfaceInverse },
  heroTitle: { fontFamily: fonts.display, fontSize: 32, color: c.onSurfaceInverse, lineHeight: 38, marginTop: 4 },
  kpis: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: -24 },
  kpi: {
    flex: 1,
    backgroundColor: c.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  kpiVal: { fontFamily: fonts.display, fontSize: 22, color: c.error },
  kpiUnit: { fontFamily: fonts.text, fontSize: 12, color: c.muted },
  kpiLabel: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: 2 },
  card: {
    backgroundColor: c.surfaceSecondary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 17, color: c.onSurface, marginBottom: 12 },
  cardNote: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 8, lineHeight: 17 },
  bars: { flexDirection: "row", justifyContent: "space-around", height: 170, alignItems: "flex-end" },
  barCol: { alignItems: "center", width: 56 },
  barVal: { fontFamily: fonts.text, fontSize: 12, color: c.onSurfaceSecondary, marginBottom: 4 },
  barTrack: {
    width: 36,
    height: 120,
    backgroundColor: c.surfaceTertiary,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: 6 },
  barYear: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 6 },
  lineLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  lineLabel: { fontFamily: fonts.text, fontSize: 11, color: c.muted, textAlign: "center" },
  lineVal: { color: c.onSurface },
  treeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 8 },
  treeYear: { fontFamily: fonts.text, fontSize: 13, color: c.muted, width: 40 },
  treeIcons: { flex: 1, flexDirection: "row", gap: 2, flexWrap: "wrap" },
  treeVal: { fontFamily: fonts.display, fontSize: 15, color: c.onSurface },
  section: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface, marginTop: 32, marginBottom: 8, paddingHorizontal: 16 },
  faunaIdx: { flexDirection: "row", gap: 8, marginBottom: 8 },
  faunaIdxBox: { flex: 1, backgroundColor: c.brandTertiary, borderRadius: 12, padding: 12 },
  faunaIdxNum: { fontFamily: fonts.display, fontSize: 24, color: c.error },
  faunaIdxLabel: { fontFamily: fonts.text, fontSize: 12, color: c.onBrandTertiary },
  faunaRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.divider },
  faunaHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  faunaName: { fontFamily: fonts.text, fontSize: 14, color: c.onSurface, flex: 1 },
  faunaPct: { fontFamily: fonts.display, fontSize: 16, color: c.error },
  migBadge: { backgroundColor: c.warning, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  migText: { fontFamily: fonts.text, fontSize: 10, color: c.onWarning },
  faunaTrack: { height: 6, borderRadius: 3, backgroundColor: c.surfaceTertiary, marginTop: 6, overflow: "hidden" },
  faunaFill: { height: 6, backgroundColor: c.error },
  faunaEx: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: 4 },
  tip: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: { fontFamily: fonts.text, fontSize: 15, color: c.onSurface },
  tipText: { fontFamily: fonts.text, fontSize: 13, color: c.muted, marginTop: 2, lineHeight: 18 },
  sources: { paddingHorizontal: 16 },
  source: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  sourceText: { fontFamily: fonts.text, fontSize: 14, color: c.brandPrimary, flex: 1 },
  disclaimer: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: 12, lineHeight: 16 },
}));
