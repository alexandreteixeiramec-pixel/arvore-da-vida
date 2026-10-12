import Feather from "@react-native-vector-icons/feather";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createReport, uploadPhoto } from "@/src/api";
import { useToast } from "@/src/components/Toast";
import { CENTER } from "@/src/data/vegetation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const CATEGORIES = ["Corte de árvore", "Aterro no mangue", "Queimada", "Lixo / entulho", "Construção irregular"];

type PermState = "idle" | "explain" | "denied" | "blocked";

export default function NewReportScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();

  const [photo, setPhoto] = useState<{ uri: string; mime: string } | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locPerm, setLocPerm] = useState<PermState>("idle");
  const [camPerm, setCamPerm] = useState<PermState>("idle");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- Location ----------
  const requestLocation = async () => {
    const current = await Location.getForegroundPermissionsAsync();
    let status = current.status;
    let canAskAgain = current.canAskAgain;
    if (status !== "granted" && canAskAgain) {
      const res = await Location.requestForegroundPermissionsAsync();
      status = res.status;
      canAskAgain = res.canAskAgain;
    }
    if (status !== "granted") {
      setLocPerm(canAskAgain && locPerm !== "denied" ? "denied" : "blocked");
      return;
    }
    setLocPerm("idle");
    setLocLoading(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      toast("Não foi possível obter sua localização.", "error");
    } finally {
      setLocLoading(false);
    }
  };

  const onLocationPress = async () => {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === "granted") return requestLocation();
    if (!current.canAskAgain) return setLocPerm("blocked");
    setLocPerm("explain");
  };

  // ---------- Camera / gallery ----------
  const takePhoto = async () => {
    const current = await ImagePicker.getCameraPermissionsAsync();
    let { status, canAskAgain } = current;
    if (status !== "granted" && canAskAgain) {
      const res = await ImagePicker.requestCameraPermissionsAsync();
      status = res.status;
      canAskAgain = res.canAskAgain;
    }
    if (status !== "granted") {
      setCamPerm(canAskAgain && camPerm !== "denied" ? "denied" : "blocked");
      return;
    }
    setCamPerm("idle");
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (!r.canceled) setPhoto({ uri: r.assets[0].uri, mime: r.assets[0].mimeType ?? "image/jpeg" });
  };

  const onCameraPress = async () => {
    const current = await ImagePicker.getCameraPermissionsAsync();
    if (current.status === "granted") return takePhoto();
    if (!current.canAskAgain) return setCamPerm("blocked");
    setCamPerm("explain");
  };

  const pickGallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (!r.canceled) setPhoto({ uri: r.assets[0].uri, mime: r.assets[0].mimeType ?? "image/jpeg" });
  };

  const submit = async () => {
    if (desc.trim().length < 3) return toast("Descreva o que você viu.", "error");
    const point = coords ?? { lat: CENTER[0], lng: CENTER[1] };
    setSaving(true);
    try {
      const photo_path = photo ? await uploadPhoto(photo.uri, photo.mime) : null;
      await createReport({
        description: desc.trim(),
        category,
        latitude: point.lat,
        longitude: point.lng,
        photo_path,
      });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      toast("Denúncia registrada. Obrigado por proteger a ilha!");
      router.back();
    } catch (e: any) {
      toast(e?.message ?? "Falha ao enviar. Tente de novo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const STICKY = 52 + 24;

  return (
    <View style={styles.root} testID="new-report-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="new-report-close-btn" onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Feather name="x" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Nova denúncia</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={STICKY + 16}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: STICKY + insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <Text style={styles.label}>Foto</Text>
        {photo ? (
          <View>
            <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" testID="new-report-photo-preview" />
            <Pressable style={styles.removePhoto} onPress={() => setPhoto(null)} testID="remove-photo-btn">
              <Feather name="trash-2" size={16} color={colors.onError} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <Pressable style={styles.photoBox} onPress={onCameraPress} testID="take-photo-btn">
              <Feather name="camera" size={26} color={colors.brandPrimary} />
              <Text style={styles.photoText}>Tirar foto</Text>
            </Pressable>
            <Pressable style={styles.photoBox} onPress={pickGallery} testID="pick-gallery-btn">
              <Feather name="image" size={26} color={colors.brandPrimary} />
              <Text style={styles.photoText}>Galeria</Text>
            </Pressable>
          </View>
        )}
        <PermBanner
          state={camPerm}
          text="A câmera é usada só para fotografar o desmatamento que você quer denunciar."
          onAllow={takePhoto}
          onDismiss={() => setCamPerm("idle")}
          testPrefix="camera"
        />

        {/* Location */}
        <Text style={styles.label}>Localização</Text>
        <Pressable style={styles.locRow} onPress={onLocationPress} testID="get-location-btn">
          <Feather name="map-pin" size={20} color={colors.brandPrimary} />
          <Text style={styles.locText} testID="location-value">
            {locLoading
              ? "Buscando sua posição..."
              : coords
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : "Usar minha localização atual"}
          </Text>
          {locLoading && <ActivityIndicator color={colors.brandPrimary} />}
        </Pressable>
        {!coords && <Text style={styles.hint}>Sem localização, o ponto será marcado no centro da ilha.</Text>}
        <PermBanner
          state={locPerm}
          text="Sua localização marca o ponto exato da denúncia no mapa da ilha."
          onAllow={requestLocation}
          onDismiss={() => setLocPerm("idle")}
          testPrefix="location"
        />

        {/* Category */}
        <Text style={styles.label}>O que está acontecendo?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipRow}>
          {CATEGORIES.map((c, i) => (
            <Pressable
              key={c}
              testID={`category-chip-${i}`}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Description */}
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          testID="report-description-input"
          style={styles.input}
          multiline
          value={desc}
          onChangeText={setDesc}
          placeholder="Ex.: Corte de 3 árvores na rua principal, perto da praça."
          placeholderTextColor={colors.muted}
          maxLength={1000}
        />
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ opened: insets.bottom }} style={[styles.sticky, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable testID="submit-report-btn" style={[styles.submit, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <>
              <Feather name="send" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.submitText}>Enviar denúncia</Text>
            </>
          )}
        </Pressable>
      </KeyboardStickyView>
    </View>
  );
}

function PermBanner({
  state,
  text,
  onAllow,
  onDismiss,
  testPrefix,
}: {
  state: PermState;
  text: string;
  onAllow: () => void;
  onDismiss: () => void;
  testPrefix: string;
}) {
  const styles = useStyles();
  if (state === "idle") return null;
  const blocked = state === "blocked";
  return (
    <View style={styles.perm} testID={`${testPrefix}-permission-banner`}>
      <Text style={styles.permText}>
        {state === "explain" ? text : blocked ? "Permissão bloqueada. Ative nas configurações do aparelho." : "Permissão negada. " + text}
      </Text>
      <View style={styles.permActions}>
        <Pressable onPress={onDismiss} style={styles.permGhost} testID={`${testPrefix}-permission-later-btn`}>
          <Text style={styles.permGhostText}>Agora não</Text>
        </Pressable>
        <Pressable
          onPress={blocked ? () => Linking.openSettings() : onAllow}
          style={styles.permBtn}
          testID={`${testPrefix}-permission-allow-btn`}
        >
          <Text style={styles.permBtnText}>{blocked ? "Abrir configurações" : state === "denied" ? "Tentar de novo" : "Permitir"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 24, color: c.onSurface },
  label: { fontFamily: fonts.text, fontSize: 13, color: c.muted, marginTop: 24, marginBottom: 8, letterSpacing: 0.5 },
  photoRow: { flexDirection: "row", gap: 12 },
  photoBox: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: c.borderStrong,
    backgroundColor: c.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoText: { fontFamily: fonts.text, fontSize: 14, color: c.brandPrimary },
  photo: { width: "100%", height: 220, borderRadius: 20 },
  removePhoto: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.error,
    alignItems: "center",
    justifyContent: "center",
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
  },
  locText: { fontFamily: fonts.text, fontSize: 15, color: c.onSurface, flex: 1 },
  hint: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 6 },
  chipRow: { height: 56, flexGrow: 0 },
  chips: { gap: 8, alignItems: "center" },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontFamily: fonts.text, fontSize: 13, color: c.onSurface },
  chipTextActive: { color: c.onBrandPrimary },
  input: {
    minHeight: 120,
    borderRadius: 12,
    padding: 16,
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
    fontFamily: fonts.text,
    fontSize: 15,
    color: c.onSurface,
    textAlignVertical: "top",
  },
  sticky: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  submit: {
    height: 52,
    borderRadius: 999,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { fontFamily: fonts.text, fontSize: 16, color: c.onBrandPrimary },
  perm: { marginTop: 12, padding: 16, borderRadius: 12, backgroundColor: c.brandTertiary },
  permText: { fontFamily: fonts.text, fontSize: 13, color: c.onBrandTertiary, lineHeight: 19 },
  permActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  permGhost: { height: 44, paddingHorizontal: 16, justifyContent: "center" },
  permGhostText: { fontFamily: fonts.text, color: c.onBrandTertiary },
  permBtn: { height: 44, paddingHorizontal: 16, justifyContent: "center", borderRadius: 999, backgroundColor: c.brandPrimary },
  permBtnText: { fontFamily: fonts.text, color: c.onBrandPrimary },
}));
