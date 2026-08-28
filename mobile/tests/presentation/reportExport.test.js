import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ReportExportScreen from '../../app/(shared)/report-export.js';
import { ReportAccessDeniedError } from '../../src/application/use-cases/reporting/index.js';

const PERIOD_END = '2026-08-27T23:59:59.999Z';

describe('report export action', () => {
  test('shows a local-file confirmation after an authorized export', async () => {
    const exportReport = {
      execute: jest.fn().mockResolvedValue({
        shared: false,
        uri: 'file:///documents/report.json',
      }),
    };
    render(
      <ReportExportScreen
        exportReport={exportReport}
        initialPeriodEnd={PERIOD_END}
        patientId={1}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Export selected report' }));
    expect(await screen.findByText('Export ready')).toBeOnTheScreen();
    expect(screen.getByText('The file was saved locally.')).toBeOnTheScreen();
    expect(
      screen.getByText('No external transmission was initiated by MySeizures.'),
    ).toBeOnTheScreen();
    expect(exportReport.execute).toHaveBeenCalledWith({
      patientId: 1,
      periodType: 'WEEKLY',
      periodEnd: PERIOD_END,
      share: true,
    });
  });

  test('shows a non-disclosing denied state and no file location', async () => {
    const exportReport = {
      execute: jest.fn().mockRejectedValue(new ReportAccessDeniedError()),
    };
    render(
      <ReportExportScreen
        exportReport={exportReport}
        initialPeriodEnd={PERIOD_END}
        patientId={1}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Export selected report' }));
    await waitFor(() => expect(screen.getByText('Access denied')).toBeOnTheScreen());
    expect(screen.queryByText(/Local file:/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Export ready')).not.toBeOnTheScreen();
  });
});
