import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { buildMapHtml, type MapState } from "./mapHtml";

type Props = MapState & { interactive?: boolean; command?: { recenter?: boolean; flyTo?: [number, number]; n: number } };

export default function LeafletMap({ year, base, reports, interactive = true, command }: Props) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  // HTML built once; later updates are pushed via injected JS so the map never reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml({ year, base, reports }, interactive), []);

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
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { flex: 1, overflow: "hidden" } });
