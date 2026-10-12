import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from "react";
import { Text } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles } from "@/src/theme";

type Kind = "success" | "error";
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: PropsWithChildren) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ msg: string; kind: Kind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, kind: Kind = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, kind });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOutUp}
          testID="toast"
          style={[styles.toast, { top: insets.top + 8 }, toast.kind === "error" && styles.error]}
        >
          <Text style={styles.text}>{toast.msg}</Text>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const useStyles = makeStyles((c) => ({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: c.surfaceInverse,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  error: { backgroundColor: c.error },
  text: { color: c.onSurfaceInverse, fontFamily: fonts.text, fontSize: 14 },
}));
