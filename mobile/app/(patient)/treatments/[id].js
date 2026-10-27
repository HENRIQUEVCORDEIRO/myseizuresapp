import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { getContainer } from '../../../src/composition/container.js';
import { AccessibleButton, FormFeedback } from '../../../src/presentation/components/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';
import { TreatmentForm } from './new.js';

export function EditTreatment({ getTreatment, manageTreatment, treatmentId }) {
  const router = useRouter();
  const [treatment, setTreatment] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setTreatment(undefined);
    setError(null);

    getTreatment
      .execute(Number(treatmentId))
      .then((value) => {
        if (active) setTreatment(value);
      })
      .catch(() => {
        if (active) {
          setTreatment(null);
          setError('Não foi possível carregar o tratamento.');
        }
      });

    return () => {
      active = false;
    };
  }, [getTreatment, treatmentId]);

  if (treatment === undefined) return <Text>Carregando tratamento…</Text>;
  if (treatment === null) {
    return (
      <>
        <FormFeedback message={error ?? 'Tratamento não encontrado.'} variant="error" />
        <AccessibleButton
          title="Voltar"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          variant="secondary"
        />
      </>
    );
  }

  return <TreatmentForm initialTreatment={treatment} manageTreatment={manageTreatment} />;
}

function Connected() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  return <EditTreatment {...getContainer().treatmentForPatient(patientId)} treatmentId={id} />;
}

export default function EditTreatmentScreen(props) {
  return props?.getTreatment ? <EditTreatment {...props} /> : <Connected />;
}
