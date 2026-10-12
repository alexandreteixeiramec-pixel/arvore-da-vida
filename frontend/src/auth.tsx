import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";

import { appleLogin, exchangeSession, fetchMe, logoutRequest, setAuthToken, setUnauthorizedHandler, type User } from "@/src/api";
import { storage } from "@/src/utils/storage";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "session_token";
const AUTH_URL = "https://auth.emergentagent.com/?redirect=";

type AuthState = {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(Ctx);

const extractSessionId = (url: string | null | undefined) => {
  if (!url) return null;
  const m = url.match(/[?#&]session_id=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sent = useRef(new Set<string>());

  const clear = useCallback(async () => {
    await storage.secureRemove(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const finish = useCallback(async (token: string, u: User) => {
    await storage.secureSet(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(u);
  }, []);

  const processSessionId = useCallback(
    async (sid: string) => {
      if (sent.current.has(sid)) return true;
      sent.current.add(sid);
      const { session_token, user: u } = await exchangeSession(sid);
      await finish(session_token, u);
      return true;
    },
    [finish],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
    });
    let sub: { remove: () => void } | null = null;
    (async () => {
      try {
        // 1. A session_id in the URL wins (web redirect or cold-start deep link)
        let sid: string | null = null;
        if (Platform.OS === "web") {
          sid = extractSessionId(window.location.href);
        } else {
          sid = extractSessionId(await Linking.getInitialURL());
        }
        if (sid) {
          await processSessionId(sid);
          if (Platform.OS === "web") {
            const url = new URL(window.location.href);
            url.searchParams.delete("session_id");
            let hash = url.hash.replace(/^#/, "").split("&").filter((p) => !p.startsWith("session_id=")).join("&");
            url.hash = hash ? `#${hash}` : "";
            window.history.replaceState(window.history.state, "", url.toString());
          }
          return;
        }
        // 2. Existing token
        const token = await storage.secureGet<string | null>(TOKEN_KEY, null);
        if (token) {
          setAuthToken(token);
          const me = await fetchMe();
          if (me) setUser(me);
          else await clear();
        }
      } catch {
        await clear();
      } finally {
        setLoading(false);
      }
    })();

    if (Platform.OS !== "web") {
      sub = Linking.addEventListener("url", ({ url }) => {
        const sid = extractSessionId(url);
        if (sid) processSessionId(sid).catch(() => {});
      });
    }
    return () => {
      sub?.remove();
      setUnauthorizedHandler(null);
    };
  }, [clear, processSessionId]);

  const signInGoogle = useCallback(async () => {
    if (Platform.OS === "web") {
      const redirect = window.location.origin + "/";
      window.location.href = AUTH_URL + encodeURIComponent(redirect);
      return;
    }
    const redirect = Linking.createURL("");
    let captured: string | null = null;
    const listener = Linking.addEventListener("url", ({ url }) => {
      captured = url;
    });
    try {
      const result = await WebBrowser.openAuthSessionAsync(AUTH_URL + encodeURIComponent(redirect), redirect);
      const url = (result.type === "success" ? result.url : null) ?? captured ?? (await Linking.getInitialURL());
      const sid = extractSessionId(url);
      if (sid) await processSessionId(sid);
      else if (result.type !== "success") throw new Error("cancel");
    } finally {
      listener.remove();
    }
  }, [processSessionId]);

  const signInApple = useCallback(async () => {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!cred.identityToken) throw new Error("Sem token da Apple");
    const fullName = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(" ") || null;
    const { session_token, user: u } = await appleLogin({
      identity_token: cred.identityToken,
      full_name: fullName,
      email: cred.email,
    });
    await finish(session_token, u);
  }, [finish]);

  const signOut = useCallback(async () => {
    await logoutRequest();
    await clear();
  }, [clear]);

  return <Ctx.Provider value={{ user, loading, signInGoogle, signInApple, signOut }}>{children}</Ctx.Provider>;
}
