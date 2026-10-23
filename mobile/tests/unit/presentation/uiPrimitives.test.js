import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  Button,
  Card,
  Chip,
  ChoiceGroup,
  EmptyState,
  Field,
  Screen,
  SegmentedControl,
  SelectSheet,
  StatTile,
} from '../../../src/presentation/components/ui/index.js';
import { colors, touchTarget } from '../../../src/presentation/theme/tokens.js';

describe('design tokens', () => {
  it('exposes a frozen token set with the palette the project already uses', () => {
    expect(colors.action).toBe('#175CD3');
    expect(colors.textPrimary).toBe('#17324D');
    expect(colors.surfaceSubtle).toBe('#F8FAFC');
    expect(touchTarget.min).toBeGreaterThanOrEqual(44);
  });
});

describe('Button', () => {
  it('exposes an accessible button role, label, and state', () => {
    render(<Button accessibilityLabel="Registrar crise" onPress={() => {}} title="Registrar" />);

    const button = screen.getByLabelText('Registrar crise');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityState).toMatchObject({ busy: false, disabled: false });
  });

  it('marks a busy button as unavailable and disabled', () => {
    render(<Button busy onPress={() => {}} title="Salvando" />);

    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
  });
});

describe('Card', () => {
  it('renders a plain container without a button role', () => {
    render(<Card title="Tratamentos">conteúdo</Card>);

    expect(screen.getByText('Tratamentos')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('becomes a single large affordance when it is pressable', () => {
    render(
      <Card accessibilityLabel="Abrir tratamentos" onPress={() => {}} title="Tratamentos">
        conteúdo
      </Card>,
    );

    const card = screen.getByLabelText('Abrir tratamentos');
    expect(card.props.accessibilityRole).toBe('button');
  });
});

describe('Chip', () => {
  it('announces the selected state', () => {
    render(<Chip label="Sono" onPress={() => {}} selected />);

    expect(screen.getByLabelText('Sono').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('shows a check mark next to the label so selection is not conveyed by color alone', () => {
    render(<Chip label="Sono" onPress={() => {}} selected />);

    expect(screen.getByText('✓', { includeHiddenElements: true })).toBeTruthy();
  });
});

describe('SegmentedControl', () => {
  it('marks exactly the current value as selected', () => {
    render(
      <SegmentedControl
        onValueChange={() => {}}
        options={[
          { label: 'Semana', value: 'WEEKLY' },
          { label: 'Mês', value: 'MONTHLY' },
        ]}
        value="WEEKLY"
      />,
    );

    expect(screen.getByLabelText('Semana').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByLabelText('Mês').props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it('reports the chosen value', () => {
    const onValueChange = jest.fn();
    render(
      <SegmentedControl
        onValueChange={onValueChange}
        options={[
          { label: 'Semana', value: 'WEEKLY' },
          { label: 'Mês', value: 'MONTHLY' },
        ]}
        value="WEEKLY"
      />,
    );

    fireEvent.press(screen.getByLabelText('Mês'));
    expect(onValueChange).toHaveBeenCalledWith('MONTHLY');
  });
});

describe('ChoiceGroup', () => {
  it('selects a single option and reports it', () => {
    const onValueChange = jest.fn();
    render(
      <ChoiceGroup
        onValueChange={onValueChange}
        options={[
          { label: 'Focal', value: 'FOCAL' },
          { label: 'Generalizada', value: 'GENERALIZED' },
        ]}
        value="FOCAL"
      />,
    );

    fireEvent.press(screen.getByLabelText('Generalizada'));
    expect(onValueChange).toHaveBeenCalledWith('GENERALIZED');
  });

  it('toggles values in multiple mode', () => {
    const onValueChange = jest.fn();
    render(
      <ChoiceGroup
        multiple
        onValueChange={onValueChange}
        options={[
          { label: 'Sono', value: 'SLEEP' },
          { label: 'Estresse', value: 'STRESS' },
        ]}
        values={['SLEEP']}
      />,
    );

    fireEvent.press(screen.getByLabelText('Estresse'));
    expect(onValueChange).toHaveBeenCalledWith(['SLEEP', 'STRESS']);
  });
});

describe('SelectSheet', () => {
  it('keeps the free-text field hidden until the free-form option is chosen', () => {
    render(
      <SelectSheet
        allowOther
        onClose={() => {}}
        onConfirm={() => {}}
        options={[
          { label: 'Sono', value: 'SLEEP' },
          { label: 'Outra causa', value: 'OTHER' },
        ]}
        value="SLEEP"
        visible
      />,
    );

    expect(screen.queryByLabelText('Descrição da outra opção')).toBeNull();
  });

  it('requires a description when the free-form option is confirmed', () => {
    const onConfirm = jest.fn();
    render(
      <SelectSheet
        allowOther
        onClose={() => {}}
        onConfirm={onConfirm}
        options={[{ label: 'Outra causa', value: 'OTHER' }]}
        value="OTHER"
        visible
      />,
    );

    fireEvent.press(screen.getByLabelText('Confirmar seleção'));
    expect(onConfirm).toHaveBeenCalledWith({
      other: '',
      value: 'OTHER',
      values: ['OTHER'],
    });
  });
});

describe('StatTile', () => {
  it('states the metric value in the accessible label', () => {
    render(<StatTile caption="3 no período" label="Convulsões" value="3" />);

    expect(screen.getByLabelText('Convulsões: 3. 3 no período')).toBeTruthy();
  });
});

describe('Field', () => {
  it('marks the field invalid and announces the error', () => {
    render(<Field error="Informe um horário válido." label="Horário" onChangeText={() => {}} />);

    expect(screen.getByLabelText('Horário').props.accessibilityState).toMatchObject({
      invalid: true,
    });
    expect(screen.getByText('Informe um horário válido.')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('offers a recovery action when one exists', () => {
    const onAction = jest.fn();
    render(<EmptyState actionLabel="Tentar de novo" onAction={onAction} title="Falhou" />);

    fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('Screen', () => {
  it('renders a header with an accessible heading role', () => {
    render(<Screen title="Início">conteúdo</Screen>);

    expect(screen.getByText('Início').props.accessibilityRole).toBe('header');
  });
});
