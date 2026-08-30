// Dining guide card — surfaces order SUGGESTIONS for a dining stop: which meal
// it is, and what to order for the party. Not a rule — "order what you like".
import { View } from 'react-native';

import { Card, StatusPill, Txt } from './ui';
import { useWayfare } from './theme';
import { dishesOf, mealFor } from '@/lib/dining';
import type { Activity } from '@/lib/types';

export function DiningGuide({
  activity,
  partySize = 1,
  now = false,
}: {
  activity: Activity;
  partySize?: number;
  /** Highlight as the meal happening right now (auto — no manual check-in). */
  now?: boolean;
}) {
  const { c } = useWayfare();
  const meal = mealFor(activity.time);
  const dishes = dishesOf(activity.mealSuggestion);

  return (
    <Card style={now ? { borderWidth: 1.5, borderColor: c.a1 } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        {now ? <StatusPill label="● NOW" tone="active" /> : null}
        <View style={{ backgroundColor: c.a1 + '2E', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
          <Txt style={{ color: c.a1, fontWeight: '800', fontSize: 10.5, letterSpacing: 0.4 }}>
            {meal.emoji} {meal.label.toUpperCase()}
          </Txt>
        </View>
        {activity.time ? (
          <Txt variant="small" faint style={{ marginLeft: 'auto' }}>
            {activity.time}
          </Txt>
        ) : null}
      </View>

      <Txt style={{ fontWeight: '800', fontSize: 15, marginTop: 8 }} numberOfLines={1}>
        {activity.where}
      </Txt>
      <Txt variant="small" muted style={{ marginTop: 1 }}>
        Suggestions for {partySize} {partySize === 1 ? 'person' : 'people'} · order what you like
      </Txt>

      {dishes.length ? (
        <View style={{ gap: 8, marginTop: 10 }}>
          {dishes.map((d, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 20, height: 20, borderRadius: 7, backgroundColor: c.a1, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Txt style={{ color: '#3a2600', fontWeight: '800', fontSize: 11 }}>{i + 1}</Txt>
              </View>
              <Txt variant="sec" style={{ flex: 1, lineHeight: 20 }}>
                {d}
              </Txt>
            </View>
          ))}
        </View>
      ) : (
        <Txt variant="small" muted style={{ marginTop: 8 }}>
          Ask for the house specialty.
        </Txt>
      )}

      <Txt variant="small" faint style={{ marginTop: 10, fontStyle: 'italic', lineHeight: 16 }}>
        Just a guide — nothing's fixed. Follow your cravings.
      </Txt>
    </Card>
  );
}
