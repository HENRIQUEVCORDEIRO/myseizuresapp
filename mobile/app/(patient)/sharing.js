import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../src/composition/container.js';
import {
  AccessibleButton,
  ApplicationState,
  FormFeedback,
  FormField,
} from '../../src/presentation/components/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

function activeGrants(grants) {
  return grants.filter((grant) => grant.revokedAt === null);
}

export function SharingManagement({ grantAccess, listAccessGrants, revokeAccess }) {
  const [grants, setGrants] = useState([]);
  const [professionalId, setProfessionalId] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState('loading');
  const [busyGrantId, setBusyGrantId] = useState(null);

  const loadGrants = useCallback(async () => {
    setStatus('loading');
    setFeedback(null);
    try {
      const result = await listAccessGrants.execute();
      if (!result.ok) {
        setGrants([]);
        setFeedback({ message: result.error.message, variant: 'error' });
        setStatus('error');
        return;
      }

      setGrants(activeGrants(result.value));
      setStatus('success');
    } catch {
      setGrants([]);
      setFeedback({ message: 'The sharing request could not be completed.', variant: 'error' });
      setStatus('error');
    }
  }, [listAccessGrants]);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  async function createGrant() {
    const medicCaretakerId = Number(professionalId);
    if (!Number.isInteger(medicCaretakerId) || medicCaretakerId < 1) {
      setFieldError('Enter a positive professional identifier.');
      return;
    }

    setFieldError(null);
    setFeedback(null);
    setStatus('granting');
    try {
      const result = await grantAccess.execute({ medicCaretakerId });
      if (!result.ok) {
        setFeedback({ message: result.error.message, variant: 'error' });
        return;
      }

      setProfessionalId('');
      setGrants((current) => [...current, result.value]);
      setFeedback({ message: 'Access granted.', variant: 'success' });
    } catch {
      setFeedback({ message: 'The sharing request could not be completed.', variant: 'error' });
    } finally {
      setStatus('success');
    }
  }

  async function revoke(grantId) {
    setBusyGrantId(grantId);
    setFeedback(null);
    try {
      const result = await revokeAccess.execute({ grantId });
      if (!result.ok) {
        setFeedback({ message: result.error.message, variant: 'error' });
        return;
      }

      setGrants((current) => current.filter((grant) => grant.id !== grantId));
      setFeedback({ message: 'Access revoked.', variant: 'success' });
    } catch {
      setFeedback({ message: 'The sharing request could not be completed.', variant: 'error' });
    } finally {
      setBusyGrantId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Manage sharing
          </Text>
          <Text style={styles.description}>
            You control which doctor or caregiver can review your care information.
          </Text>
        </View>

        <FormField
          accessibilityHint="Enter the numeric identifier supplied to the doctor or caregiver"
          error={fieldError}
          keyboardType="number-pad"
          label="Professional identifier"
          onChangeText={setProfessionalId}
          value={professionalId}
        />
        <AccessibleButton
          accessibilityHint="Creates an active sharing relationship"
          accessibilityLabel="Grant professional access"
          busy={status === 'granting'}
          onPress={createGrant}
          title="Grant access"
        />
        <FormFeedback message={feedback?.message} variant={feedback?.variant} />

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Active access
        </Text>
        {status === 'loading' ? (
          <ApplicationState
            message="Checking your sharing relationships."
            title="Loading access"
            variant="loading"
          />
        ) : null}
        {status === 'error' ? (
          <ApplicationState
            actionHint="Attempts to load active sharing relationships again"
            actionLabel="Try again"
            message="Active access could not be loaded. No clinical information was shared."
            onAction={loadGrants}
            title="Sharing unavailable"
            variant="error"
          />
        ) : null}
        {status === 'success' && grants.length === 0 ? (
          <ApplicationState
            message="No doctor or caregiver currently has access."
            title="No active access"
          />
        ) : null}
        {status === 'success' && grants.length > 0 ? (
          <View
            accessibilityLabel="Professionals with active access"
            accessibilityRole="list"
            style={styles.list}
          >
            {grants.map((grant) => (
              <View
                accessibilityLabel={`Professional ${grant.medicCaretakerId} has active access`}
                accessibilityRole="listitem"
                key={grant.id}
                style={styles.card}
              >
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Professional {grant.medicCaretakerId}</Text>
                  <Text style={styles.activeStatus}>Active access</Text>
                  <Text style={styles.metadata}>Granted {grant.grantedAt}</Text>
                </View>
                <AccessibleButton
                  accessibilityHint={`Removes access for professional ${grant.medicCaretakerId}`}
                  accessibilityLabel={`Revoke access for professional ${grant.medicCaretakerId}`}
                  busy={busyGrantId === grant.id}
                  disabled={busyGrantId !== null && busyGrantId !== grant.id}
                  onPress={() => revoke(grant.id)}
                  title="Revoke access"
                  variant="secondary"
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectedSharingScreen() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  return <SharingManagement {...getContainer().accessForPatient(patientId)} />;
}

export default function SharingScreen(props) {
  return props?.listAccessGrants ? <SharingManagement {...props} /> : <ConnectedSharingScreen />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 18, padding: 24 },
  heading: { gap: 8 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  sectionTitle: { color: '#17324D', fontSize: 21, fontWeight: '700', marginTop: 8 },
  list: { gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, gap: 16, padding: 16 },
  cardCopy: { gap: 4 },
  cardTitle: { color: '#17324D', fontSize: 17, fontWeight: '700' },
  activeStatus: { color: '#067647', fontSize: 15, fontWeight: '700' },
  metadata: { color: '#475467', fontSize: 14 },
});
