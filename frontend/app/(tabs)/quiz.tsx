import Feather from "@react-native-vector-icons/feather";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInRight, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QUESTIONS } from "@/src/data/quiz";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function QuizScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[idx];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const right = i === q.answer;
    if (right) setScore((s) => s + 1);
    if (Platform.OS !== "web")
      Haptics.notificationAsync(right ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  };

  const next = () => {
    if (idx + 1 >= QUESTIONS.length) {
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  };

  const restart = () => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = score / QUESTIONS.length;
    const msg =
      pct >= 0.8 ? "Guardiã(o) da Árvore da Vida!" : pct >= 0.5 ? "Bom caminho, semente germinando!" : "Vamos regar esse conhecimento!";
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top, paddingBottom: bottomChrome + 24 }]} testID="quiz-result">
        <Animated.View entering={ZoomIn} style={styles.resultCircle}>
          <Text style={styles.resultScore} testID="quiz-score">{score}/{QUESTIONS.length}</Text>
        </Animated.View>
        <Text style={styles.resultMsg}>{msg}</Text>
        <Text style={styles.sub}>Desafie sua turma e compare os resultados.</Text>
        <Pressable style={styles.btn} onPress={restart} testID="quiz-restart-btn">
          <Feather name="rotate-ccw" size={16} color={colors.onBrandPrimary} />
          <Text style={styles.btnText}>Jogar de novo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: bottomChrome + 24 }}
      testID="quiz-screen"
    >
      <Text style={styles.kicker}>QUIZ DA TURMA</Text>
      <View style={styles.progressRow}>
        <Text style={styles.progressText} testID="quiz-progress">
          Pergunta {idx + 1} de {QUESTIONS.length}
        </Text>
        <Text style={styles.progressText}>Acertos: {score}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((idx + 1) / QUESTIONS.length) * 100}%` }]} />
      </View>

      <Animated.View key={idx} entering={FadeInRight.duration(350)}>
        <Text style={styles.question} testID="quiz-question">{q.q}</Text>
        {q.options.map((o, i) => {
          const isAnswer = picked !== null && i === q.answer;
          const isWrong = picked === i && i !== q.answer;
          return (
            <Pressable
              key={o}
              testID={`quiz-option-${i}`}
              onPress={() => choose(i)}
              style={[styles.option, isAnswer && styles.optionRight, isWrong && styles.optionWrong]}
            >
              <Text style={[styles.optionText, (isAnswer || isWrong) && { color: colors.onSuccess }]}>{o}</Text>
              {isAnswer && <Feather name="check" size={18} color={colors.onSuccess} />}
              {isWrong && <Feather name="x" size={18} color={colors.onError} />}
            </Pressable>
          );
        })}

        {picked !== null && (
          <Animated.View entering={FadeIn} style={styles.explain} testID="quiz-explanation">
            <Text style={styles.explainTitle}>{picked === q.answer ? "Isso mesmo!" : "Quase!"}</Text>
            <Text style={styles.explainText}>{q.explain}</Text>
            <Pressable style={styles.btn} onPress={next} testID="quiz-next-btn">
              <Text style={styles.btnText}>{idx + 1 >= QUESTIONS.length ? "Ver resultado" : "Próxima"}</Text>
              <Feather name="arrow-right" size={16} color={colors.onBrandPrimary} />
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  kicker: { fontFamily: fonts.text, fontSize: 11, letterSpacing: 2, color: c.muted },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  progressText: { fontFamily: fonts.text, fontSize: 13, color: c.onSurfaceSecondary },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: c.surfaceTertiary, marginTop: 8, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: c.brandSecondary },
  question: { fontFamily: fonts.display, fontSize: 26, color: c.onSurface, lineHeight: 33, marginTop: 32, marginBottom: 24 },
  option: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionRight: { backgroundColor: c.success, borderColor: c.success },
  optionWrong: { backgroundColor: c.error, borderColor: c.error },
  optionText: { fontFamily: fonts.text, fontSize: 15, color: c.onSurface, flex: 1 },
  explain: { backgroundColor: c.brandTertiary, borderRadius: 20, padding: 16, marginTop: 8 },
  explainTitle: { fontFamily: fonts.display, fontSize: 18, color: c.onBrandTertiary },
  explainText: { fontFamily: fonts.text, fontSize: 14, color: c.onBrandTertiary, marginTop: 4, lineHeight: 20 },
  btn: {
    marginTop: 16,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { fontFamily: fonts.text, fontSize: 15, color: c.onBrandPrimary },
  resultCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: c.brandSecondary,
  },
  resultScore: { fontFamily: fonts.display, fontSize: 44, color: c.brandPrimary },
  resultMsg: { fontFamily: fonts.display, fontSize: 24, color: c.onSurface, marginTop: 24, textAlign: "center" },
  sub: { fontFamily: fonts.text, fontSize: 14, color: c.muted, marginTop: 8, textAlign: "center" },
}));
