import { useLocalSearchParams } from 'expo-router';

import { getContainer } from '../../../src/composition/container.js';
import { ApplicationState } from '../../../src/presentation/components/index.js';
import { ProfessionalReport } from '../../../src/presentation/features/reports/index.js';

function ConnectedProfessionalReport() {
  const { patientId: patientValue } = useLocalSearchParams();
  const patientId = Number(Array.isArray(patientValue) ? patientValue[0] : patientValue);

  if (!Number.isInteger(patientId) || patientId < 1) {
    return (
      <ApplicationState
        message="Choose a patient through the patient-access screen."
        title="Invalid patient"
        variant="error"
      />
    );
  }

  return (
    <ProfessionalReport
      generateReport={getContainer().reportForPatient(patientId).generateReport}
      patientId={patientId}
    />
  );
}

export default function ProfessionalReportScreen(props) {
  return props?.generateReport ? (
    <ProfessionalReport {...props} />
  ) : (
    <ConnectedProfessionalReport />
  );
}
