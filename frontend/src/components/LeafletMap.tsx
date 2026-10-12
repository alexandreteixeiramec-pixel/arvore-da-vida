import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { buildMapHtml, type MapState } from "./mapHtml";

export type LeafletMapProps = MapState & {
  interactive?: boolean;
  padTop?: number;
  padBottom?: number;
  command?: { recenter?: boolean; n: number };
  onPatch?: (id: string) => void;
};

export default function LeafletMap({ year, base, reports, interactive = true, padTop = 0, padBottom = 0, command, onPatch }: LeafletMapProps) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  // HTML built once; later updates are pushed via injected JS so the map never reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml({ year, base, reports }, interactive, padTop, padBottom), []);

  const send = (msg: object) =>
    ref.current?.injectJavaScript(`window.handle && window.handle(${JSON.stringify(JSON.stringify(msg))});true;`);

  useEffect(() => {
    if (ready) send({ year, base, reports });
  }, [ready, year, base, reports]);

  useEffect(() => {
    if (ready && command) send(command);
  }, [ready, command]);

  return (
    <View style={styles.wrap} testID="leaflet-map">
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.wrap}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onLoadEnd={() => setReady(true)}
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.type === "patch") onPatch?.(m.id);
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { flex: 1, overflow: "hidden" } });
