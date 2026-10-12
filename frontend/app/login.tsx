import Feather from "@react-native-vector-icons/feather";
import * as AppleAuthentication from "expo-apple-authentication";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { useToast } from "@/src/components/Toast";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200";

export default function LoginScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { signInGoogle, signInApple } = useAuth();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  const google = async () => {
    setBusy("google");
    try {
      await signInGoogle();
    } catch (e: any) {
      if (e?.message !== "cancel") toast("Não foi possível entrar com Google.", "error");
    } finally {
      setBusy(null);
    }
  };

  const apple = async () => {
    setBusy("apple");
    try {
      await signInApple();
    } catch (e: any) {
      if (e?.code !== "ERR_REQUEST_CANCELED") toast("Não foi possível entrar com Apple.", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root} testID="login-screen">
      <Image source={{ uri: HERO }} style={styles.abs} contentFit="cover" transition={300} />
      <LinearGradient colors={[colors.scrim, "rgba(44,47,41,0.35)", "transparent"]} style={styles.abs} />

      <View style={[styles.content, { paddingTop: insets.top + 48 }]}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <View style={styles.logo}>
            <Feather name="feather" size={28} color={colors.onBrandPrimary} />
          </View>
          <Text style={styles.kicker}>MADRE DE DEUS · BAHIA</Text>
          <Text style={styles.title} testID="login-title">Madre:{"\n"}Árvore da Vida</Text>
          <Text style={styles.sub}>
            Veja como a ilha perdeu seu verde em 30 anos, explore os dados e ajude a proteger o que resta.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(200)} style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.sheetTitle}>Entre para começar</Text>
        <Pressable testID="login-google-btn" style={styles.google} onPress={google} disabled={!!busy}>
          {busy === "google" ? (
            <ActivityIndicator color={colors.onSurface} />
          ) : (
            <>
              <Text style={styles.gMark}>G</Text>
              <Text style={styles.googleText}>Continuar com Google</Text>
            </>
          )}
        </Pressable>

        {appleAvailable && (
          <View testID="login-apple-btn" style={{ opacity: busy ? 0.6 : 1 }} pointerEvents={busy ? "none" : "auto"}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={999}
              style={styles.apple}
              onPress={apple}
            />
          </View>
        )}
        <Text style={styles.note}>Projeto escolar sobre a desarborização de Madre de Deus.</Text>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceInverse },
  abs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  content: { flex: 1, paddingHorizontal: 24 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  kicker: { fontFamily: fonts.text, fontSize: 11, letterSpacing: 2, color: c.onSurfaceInverse },
  title: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, color: c.onSurfaceInverse, marginTop: 8 },
  sub: { fontFamily: fonts.text, fontSize: 15, lineHeight: 22, color: c.onSurfaceInverse, marginTop: 12, maxWidth: 320 },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  sheetTitle: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface, marginBottom: 4 },
  google: {
    height: 52,
    borderRadius: 999,
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.borderStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  gMark: { fontFamily: fonts.display, fontSize: 20, color: c.brandPrimary },
  googleText: { fontFamily: fonts.text, fontSize: 16, color: c.onSurface },
  apple: { height: 52, width: "100%" },
  note: { fontFamily: fonts.text, fontSize: 12, color: c.muted, textAlign: "center", marginTop: 4 },
}));
