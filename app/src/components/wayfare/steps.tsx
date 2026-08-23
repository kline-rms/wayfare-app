import { View } from 'react-native';

import { Space } from '@/constants/wayfare';
import { back } from '@/lib/nav';
import { Header, Txt } from './ui';
import { useWayfare } from './theme';

// Wizard header: back + title + a progress bar.
export function StepTop({ title, step, total }: { title: string; step: number; total: number }) {
  const { c } = useWayfare();
  return (
    <View style={{ gap: Space.m }}>
      <Header title={title} onBack={back} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.ter }}>
          <View style={{ width: `${(step / total) * 100}%`, height: 6, borderRadius: 3, backgroundColor: c.primary }} />
        </View>
        <Txt variant="small" muted>
          {step} of {total}
        </Txt>
      </View>
    </View>
  );
}
