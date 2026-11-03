import { useLocalSearchParams, useRouter } from 'expo-router';

import { getContainer } from '../../../src/composition/container.js';
import { ApplicationState } from '../../../src/presentation/components/index.js';
import { ProfessionalReport } from '../../../src/presentation/features/reports/index.js';

function ConnectedProfessionalReport() {
  const router = useRouter();
  const { patientId: patientValue } = useLocalSearchParams();
  const patientId = Number(Array.isArray(patientValue) ? patientValue[0] : patientValue);

  if (!Number.isInteger(patientId) || patientId < 1) {
    return (
      <ApplicationState
        message="Escolha um paciente pela tela de acesso do paciente."
        title="Paciente inválido"
        variant="error"
      />
    );
  }

  return (
    <ProfessionalReport
      generateReport={getContainer().reportForPatient(patientId).generateReport}
      onExport={({ periodType, periodEnd }) =>
        router.push({
          pathname: '/report-export',
          params: {
            patientId: String(patientId),
            periodType,
            periodEnd,
          },
        })
      }
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
