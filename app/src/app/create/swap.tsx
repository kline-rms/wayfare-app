// Swap a place — replace one venue on the picked plan. For now it renames the
// place (and it will offer live "nearby options" from the Places cache later).
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Field, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back } from '@/lib/nav';
import { useWizardVersion, wizard } from '@/lib/wizard';
import type { Itinerary } from '@/lib/types';

function renamePlace(it: Itinerary, oldName: string, newName: string): Itinerary {
  return { ...it, places: it.places.map((p) => (p.name === oldName ? { ...p, name: newName } : p)) };
}

export default function Swap() {
  useWizardVersion();
  const { c } = useWayfare();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const chosen = wizard.getChosen();
  const [value, setValue] = useState(name ?? '');

  useEffect(() => {
    if (!chosen) back();
  }, [chosen]);
  if (!chosen) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const current = chosen.itinerary.places.find((p) => p.name === name);
  const apply = () => {
    const next = value.trim();
    if (next && name) wizard.patchChosen(renamePlace(chosen.itinerary, name, next));
    back();
  };

  const header = (
    <Pressable onPress={back}>
      <MapIconButton>
        <Icon name="back" size={22} color="#fff" />
      </MapIconButton>
    </Pressable>
  );
  return (
    <MapFirst header={header} sheetTop={0.24}>
        <Txt variant="h1">
          Swap this{'\n'}place
        </Txt>
        {current ? (
          <Txt variant="sec" muted style={{ marginTop: 6 }}>
            Replacing {current.name} · {current.area}
          </Txt>
        ) : null}

        <View style={{ marginTop: Space.l, gap: Space.m }}>
          <Field icon="pin" placeholder="New place name" value={value} onChangeText={setValue} />
          <Txt variant="small" faint>
            Type a venue, or keep the current one. Live suggestions from the Places cache are coming.
          </Txt>
        </View>

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Use this place" icon="check" knob onPress={apply} />
        </View>
    </MapFirst>
  );
}
