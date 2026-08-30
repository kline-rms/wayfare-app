// Import (native) — file picking + CSV parsing is a web feature for now, so on a
// device we point people to the build path instead.
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back, go } from '@/lib/nav';

export default function ImportScreen() {
  useWayfare();
  const header = (
    <Pressable onPress={back}>
      <MapIconButton>
        <Icon name="back" size={22} color="#fff" />
      </MapIconButton>
    </Pressable>
  );
  return (
    <MapFirst header={header} sheetTop={0.28}>
        <Txt variant="h1">
          Import{'\n'}your plan
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 6 }}>
          Uploading a spreadsheet is available on the Wayfare web app.
        </Txt>
        <View style={{ marginTop: Space.l }}>
          <AITip>Open Wayfare on the web to import a CSV — or build the trip here and AI fills the details.</AITip>
        </View>
        <View style={{ marginTop: Space.l }}>
          <PillButton label="Build it here instead" icon="wand" knob onPress={() => go('/create/basics')} />
        </View>
    </MapFirst>
  );
}
