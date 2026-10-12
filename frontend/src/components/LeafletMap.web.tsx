import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { LeafletMapProps } from "./LeafletMap";
import { buildMapHtml } from "./mapHtml";

export default function LeafletMap({ year, base, reports, interactive = true, padTop = 0, padBottom = 0, command, onPatch }: LeafletMapProps) {
  const ref = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const onPatchRef = useRef(onPatch);
  onPatchRef.current = onPatch;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml({ year, base, reports }, interactive, padTop, padBottom), []);

  const send = (msg: object) => ref.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      try {
        const m = JSON.parse(e.data);
        if (m.type === "patch") onPatchRef.current?.(m.id);
      } catch {}
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  useEffect(() => {
    if (ready) send({ year, base, reports });
  }, [ready, year, base, reports]);

  useEffect(() => {
    if (ready && command) send(command);
  }, [ready, command]);

  return (
    <View style={styles.wrap} testID="leaflet-map">
      {createElement("iframe", {
        ref,
        srcDoc: html,
        onLoad: () => setReady(true),
        style: { border: 0, width: "100%", height: "100%" },
        title: "mapa",
      })}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { flex: 1, overflow: "hidden" } });
