// Recommended places — the venues AI chose for the picked plan. Review them and
// tap Change to swap one. (Live alternatives come from the Places cache later.)
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, Chip, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back, go } from '@/lib/nav';
import { useWizardVersion, wizard } from '@/lib/wizard';

export default function Recommended() {
  useWizardVersion();
  const { c } = useWayfare();
  const chosen = wizard.getChosen();

  useEffect(() => {
    if (!chosen) back();
  }, [chosen]);
  if (!chosen) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const places = chosen.itinerary.places ?? [];

  const header = (
    <Pressable onPress={back}>
      <MapIconButton>
        <Icon name="back" size={22} color="#fff" />
      </MapIconButton>
    </Pressable>
  );
  return (
    <MapFirst header={header} sheetTop={0.2}>
        <Txt variant="small" faint>
          WE PICKED
        </Txt>
        <Txt variant="h1" style={{ marginTop: 4 }}>
          Your places
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 6 }}>
          Along your route. Tap Change to swap any of them.
        </Txt>

        <View style={{ gap: Space.m, marginTop: Space.l }}>
          {places.map((pl) => (
            <Card key={pl.name} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.m }}>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
                  {pl.name}
                </Txt>
                <Txt variant="small" muted numberOfLines={1} style={{ marginTop: 2 }}>
                  {pl.area}
                </Txt>
              </View>
              <Pressable onPress={() => go({ pathname: '/create/swap', params: { name: pl.name } })} hitSlop={6}>
                <Chip label="Change" color={c.a1} filled small />
              </Pressable>
            </Card>
          ))}
          {!places.length ? <Txt variant="sec" muted>No places on this plan yet.</Txt> : null}
        </View>

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Confirm all places" icon="check" knob onPress={back} />
        </View>
    </MapFirst>
  );
}
