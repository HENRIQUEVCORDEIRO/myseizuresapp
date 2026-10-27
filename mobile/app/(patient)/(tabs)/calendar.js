import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getContainer } from '../../../src/composition/container.js';
import { CalendarHistory } from '../../../src/presentation/features/calendar/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

function ConnectedCalendarScreen() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  const { listChronologicalEvents } = getContainer().clinicalForPatient(patientId);
  const [refreshKey, setRefreshKey] = useState(0);
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return undefined;
      }

      setRefreshKey((current) => current + 1);
      return undefined;
    }, []),
  );

  return (
    <CalendarHistory
      listChronologicalEvents={listChronologicalEvents}
      patientId={patientId}
      refreshKey={refreshKey}
    />
  );
}

export default function CalendarScreen(props) {
  if (props?.listChronologicalEvents) {
    return <CalendarHistory {...props} />;
  }

  return <ConnectedCalendarScreen />;
}
