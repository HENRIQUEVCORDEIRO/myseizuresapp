import { getContainer } from '../../src/composition/container.js';
import { CalendarHistory } from '../../src/presentation/features/calendar/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

function ConnectedCalendarScreen() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  const { listChronologicalEvents } = getContainer().clinicalForPatient(patientId);

  return (
    <CalendarHistory listChronologicalEvents={listChronologicalEvents} patientId={patientId} />
  );
}

export default function CalendarScreen(props) {
  if (props?.listChronologicalEvents) {
    return <CalendarHistory {...props} />;
  }

  return <ConnectedCalendarScreen />;
}
