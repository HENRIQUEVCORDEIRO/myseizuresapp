import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { getContainer } from '../../src/composition/container.js';
import { ProfessionalPatientList } from '../../src/presentation/features/professional/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

export default function ProfessionalHomeScreen() {
  const router = useRouter();
  const { signOut } = useAuthSession();
  const [refreshSignal, setRefreshSignal] = useState(0);
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      setRefreshSignal((current) => current + 1);
    }, []),
  );

  return (
    <ProfessionalPatientList
      listAuthorizedPatients={getContainer().listAuthorizedPatients}
      onOpenPatient={(patientId) =>
        router.push({
          pathname: '/(professional)/reports/[patientId]',
          params: { patientId: String(patientId) },
        })
      }
      onSignOut={signOut}
      refreshSignal={refreshSignal}
    />
  );
}
