import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { getContainer } from '../../../src/composition/container.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';
import { TreatmentForm } from './new.js';

export function EditTreatment({ getTreatment, manageTreatment, treatmentId }) {
  const [treatment, setTreatment] = useState();
  useEffect(() => {
    getTreatment.execute(Number(treatmentId)).then(setTreatment);
  }, [getTreatment, treatmentId]);
  if (treatment === undefined) return <Text>Loading treatment…</Text>;
  if (treatment === null) return <Text>Treatment not found.</Text>;
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
