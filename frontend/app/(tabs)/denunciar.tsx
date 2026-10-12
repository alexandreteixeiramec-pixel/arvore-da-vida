import Feather from "@react-native-vector-icons/feather";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchReports, fileUrl, type Report } from "@/src/api";
import { useAuth } from "@/src/auth";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const EMPTY_IMG =
  "https://images.unsplash.com/photo-1557600287-790c8422bcc2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900";

export default function ReportsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { user, signOut } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: ["reports"], queryFn: fetchReports });

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker} numberOfLines={1}>
          VIGILÂNCIA CIDADÃ{user?.name ? ` · ${user.name.toUpperCase()}` : ""}
        </Text>
        <Pressable testID="logout-btn" onPress={signOut} style={styles.logout} hitSlop={8}>
          <Feather name="log-out" size={16} color={colors.muted} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>Denúncias</Text>
      <Text style={styles.sub}>Viu árvores sendo cortadas ou o mangue aterrado? Registre com foto e local.</Text>
    </View>
  );

  return (
    <View style={styles.root} testID="reports-screen">
      {header}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.brandPrimary} testID="reports-loading" />
      ) : isError ? (
        <View style={styles.center} testID="reports-error">
          <Text style={styles.sub}>Não foi possível carregar as denúncias.</Text>
          <Pressable style={styles.retry} onPress={() => refetch()} testID="reports-retry-btn">
            <Text style={styles.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomChrome + 96 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <View style={styles.empty} testID="reports-empty">
              <Image source={{ uri: EMPTY_IMG }} style={styles.emptyImg} contentFit="cover" />
              <LinearGradient colors={["transparent", colors.scrim]} style={styles.emptyScrim} />
              <Text style={styles.emptyText}>Nenhuma denúncia ainda.{"\n"}Seja a primeira voz da ilha.</Text>
            </View>
          }
          renderItem={({ item, index }) => <ReportCard item={item} index={index} />}
        />
      )}
      <Pressable
        testID="new-report-btn"
        style={[styles.cta, { bottom: bottomChrome + 16 }]}
        onPress={() => router.push("/nova-denuncia")}
      >
        <Feather name="camera" size={18} color={colors.onBrandPrimary} />
        <Text style={styles.ctaText}>Reportar desmatamento</Text>
      </Pressable>
    </View>
  );
}

function ReportCard({ item, index }: { item: Report; index: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const date = new Date(item.created_at).toLocaleDateString("pt-BR");
  return (
    <Animated.View entering={FadeInDown.delay(index * 50)} style={styles.card} testID={`report-card-${item.id}`}>
      {item.photo_path ? (
        <Image source={{ uri: fileUrl(item.photo_path) }} style={styles.photo} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          <Feather name="image" size={22} color={colors.muted} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
        <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
        <Text style={styles.meta}>
          {date} · {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          {item.reporter_name ? ` · ${item.reporter_name}` : ""}
        </Text>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  logout: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingLeft: 8 },
  logoutText: { fontFamily: fonts.text, fontSize: 13, color: c.muted },
  kicker: { fontFamily: fonts.text, fontSize: 11, letterSpacing: 2, color: c.muted },
  title: { fontFamily: fonts.display, fontSize: 30, color: c.onSurface, marginTop: 2 },
  sub: { fontFamily: fonts.text, fontSize: 14, color: c.muted, marginTop: 4, lineHeight: 20 },
  center: { alignItems: "center", padding: 24 },
  retry: { marginTop: 12, paddingHorizontal: 20, height: 44, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: c.brandPrimary },
  retryText: { fontFamily: fonts.text, color: c.brandPrimary },
  empty: { height: 260, borderRadius: 20, overflow: "hidden", justifyContent: "flex-end" },
  emptyImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  emptyScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  emptyText: { fontFamily: fonts.display, fontSize: 20, color: c.onSurfaceInverse, padding: 20, lineHeight: 26 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: c.surfaceSecondary,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  photo: { width: 88, height: 88, borderRadius: 12, backgroundColor: c.surfaceTertiary },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  badge: { alignSelf: "flex-start", backgroundColor: c.brandTertiary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.text, fontSize: 11, color: c.onBrandTertiary },
  desc: { fontFamily: fonts.text, fontSize: 14, color: c.onSurface, marginTop: 6, lineHeight: 19 },
  meta: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: 4 },
  cta: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 52,
    borderRadius: 999,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { fontFamily: fonts.text, fontSize: 16, color: c.onBrandPrimary },
}));
