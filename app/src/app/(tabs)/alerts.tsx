import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AIOrb, Card, CategoryIcon, Txt } from '@/components/wayfare/ui';
import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { Space } from '@/constants/wayfare';

export default function AlertsScreen() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <Txt variant="h1">Alerts</Txt>

        <Txt variant="label" muted style={{ marginTop: Space.xl, marginBottom: Space.s }}>
          NOW
        </Txt>
        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <NotifRow
            leading={<CategoryIcon name="temple" color={c.a3} size={40} iconSize={20} />}
            title="Leave in 1 hour — Manila Cathedral"
            body="Arrive 2:00 PM · ~6 min walk across Intramuros."
            time="now"
          />
          <Divider />
          <NotifRow leading={<AIOrb size={40} />} title="Tip: Fort Santiago is best near sunset" body="You're ahead of schedule — save it for later." time="12m" />
          <Divider />
          <NotifRow
            leading={
              <View style={[styles.chip, { backgroundColor: '#E7F6EE' }]}>
                <Icon name="checkC" size={22} color={c.a2} />
              </View>
            }
            title="Checked in at National Museum"
            body="Stop marked complete in your timeline."
            time="1h"
            read
            last
          />
        </Card>

        <Txt variant="label" muted style={{ marginTop: Space.xl, marginBottom: Space.s }}>
          EARLIER
        </Txt>
        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <NotifRow leading={<CategoryIcon name="food" color={c.a4} size={40} iconSize={20} />} title="15 min before — Lunch in Intramuros" body="Wrap up at the museum and head to Casa Manila." time="Yst" read />
          <Divider />
          <NotifRow leading={<CategoryIcon name="coffee" color={c.a1} size={40} iconSize={20} />} title="1 hour before — Old Manila day" body="Grab to the National Museum for 9:00 AM." time="Yst" read last />
        </Card>
      </ScrollView>
    </View>
  );
}

function Divider() {
  const { c } = useWayfare();
  return <View style={{ height: 1, backgroundColor: c.line }} />;
}

function NotifRow({
  leading,
  title,
  body,
  time,
  read,
  last,
}: {
  leading: ReactNode;
  title: string;
  body: string;
  time: string;
  read?: boolean;
  last?: boolean;
}) {
  const { c } = useWayfare();
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      {leading}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!read ? <View style={[styles.unread, { backgroundColor: c.a1 }]} /> : null}
          <Txt style={{ fontWeight: '700', flex: 1 }} numberOfLines={2}>
            {title}
          </Txt>
        </View>
        <Txt variant="small" muted style={{ marginTop: 2 }}>
          {body}
        </Txt>
      </View>
      <Txt variant="small" faint>
        {time}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.m, paddingVertical: 14 },
  chip: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  unread: { width: 7, height: 7, borderRadius: 4 },
});
