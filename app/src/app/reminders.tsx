import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, Card, Toggle, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back } from '@/lib/nav';
import { OFFSET_PRESETS, labelFor, reminderOffsets, supportsReminders, useReminderVersion } from '@/lib/reminders';

export default function Reminders() {
  useReminderVersion();
  const { c } = useWayfare();
  const enabledCount = reminderOffsets.list().length;

  const header = (
    <View>
      <Pressable onPress={back}>
        <MapIconButton>
          <Icon name="back" size={22} color="#fff" />
        </MapIconButton>
      </Pressable>
      <Txt variant="h1" style={{ color: '#fff', marginTop: 12 }}>
        Nudge me before{'\n'}each stop
      </Txt>
    </View>
  );

  return (
    <MapFirst header={header} sheetTop={0.32}>
      <Txt variant="sec" muted>
        Pick how far ahead you want a heads-up. We&apos;ll remind you before every activity on a day when you tap “Remind me”.
      </Txt>

      <Card padded={false} style={{ marginTop: Space.l, paddingHorizontal: Space.l }}>
        {OFFSET_PRESETS.map((m, i) => (
          <View key={m} style={[styles.row, i < OFFSET_PRESETS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <View style={[styles.icon, { backgroundColor: c.fieldBg }]}>
              <Icon name="calClock" size={18} color={c.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '700' }}>{labelFor(m)}</Txt>
              <Txt variant="small" muted style={{ marginTop: 1 }}>
                {m >= 60 ? 'Time to wrap up and head out' : m === 15 ? 'Get ready to move' : 'Final call'}
              </Txt>
            </View>
            <Toggle value={reminderOffsets.has(m)} onChange={() => reminderOffsets.toggle(m)} />
          </View>
        ))}
      </Card>

      <Txt variant="small" faint style={{ marginTop: Space.m }}>
        {enabledCount ? `${enabledCount} reminder${enabledCount === 1 ? '' : 's'} per stop` : 'No reminders selected'}
      </Txt>

      <View style={{ marginTop: Space.l }}>
        <AITip>
          {supportsReminders
            ? 'Reminders account for travel time to the next place, so “15 min before” means 15 minutes before you should leave.'
            : 'Heads-up: alarms fire on the Wayfare mobile app. On the web they’re saved here but won’t ring.'}
        </AITip>
      </View>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.m, paddingVertical: 14 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
