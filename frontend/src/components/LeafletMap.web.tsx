import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { buildMapHtml, type MapState } from "./mapHtml";

type Props = MapState & { interactive?: boolean; command?: { recenter?: boolean; flyTo?: [number, number]; n: number } };

export default function LeafletMap({ year, base, reports, interactive = true, command }: Props) {
  const ref = useRef<any>(null);
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml({ year, base, reports }, interactive), []);

  const send = (msg: object) => ref.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");

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
