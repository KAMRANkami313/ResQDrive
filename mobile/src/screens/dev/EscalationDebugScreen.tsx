import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { EscalationDebugScreenProps } from '@nav/types';
import { escalationService, ackService } from '@services/escalation';
import { useEscalation } from '@hooks/useEscalation';
import { useContacts } from '@hooks/useContacts';
import { incidentService } from '@services/alert';
import { Phone, Users, Clock, CircleCheck, CircleAlert, X, Play, UserCheck } from 'lucide-react-native';

export function EscalationDebugScreen(_props: EscalationDebugScreenProps) {
  const theme = useAppTheme();
  const state = useEscalation();
  const { data: contacts } = useContacts();
  const [starting, setStarting] = useState(false);

  const handleStart = async (severityLevel: 'minor' | 'moderate' | 'severe') => {
    if (!contacts || contacts.length === 0) {
      window.alert('No emergency contacts found.\n\nPlease add at least one emergency contact in the Contacts tab first.');
      return;
    }
    setStarting(true);
    try {
      const incident = await incidentService.create({
        vehicleId: null,
        severity: severityLevel,
        severityScore: severityLevel === 'severe' ? 0.82 : severityLevel === 'moderate' ? 0.55 : 0.25,
        latitude: 33.6844,
        longitude: 73.0479,
        address: 'Islamabad',
        sensorSnapshot: null,
      });
      if (!incident) {
        window.alert('Failed to create incident record in Supabase');
        setStarting(false);
        return;
      }
      await escalationService.start({
        incidentId: incident.id,
        severity: {
          level: severityLevel,
          score: severityLevel === 'severe' ? 0.82 : severityLevel === 'moderate' ? 0.55 : 0.25,
          components: { gForceNormalized: 0, rotationNormalized: 0, speedDropNormalized: 0, soundConfidence: 0 },
          weights: { gForce: 0.4, rotation: 0.25, speedDrop: 0.2, sound: 0.15 },
          thresholds: { minor: 0.4, moderate: 0.7 },
          reasoning: [],
          timestamp: Date.now(),
        },
        sensorSnapshot: null,
        userName: 'Test User',
        userPhone: '+923001234567',
        mapsLink: 'https://www.google.com/maps?q=33.6844,73.0479',
        latitude: 33.6844,
        longitude: 73.0479,
      });
    } catch (err) {
      window.alert(`Failed to start escalation: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = () => {
    escalationService.cancel('Cancelled from debug screen');
  };

  const handleSimulateAck = async (contactId: string, contactName: string, priority: number) => {
    if (!state.incidentId) return;
    console.log('[debug] ack button clicked:', { contactId, contactName, priority });
    const ok = await ackService.acknowledgeIncident(state.incidentId, contactId, contactName);
    if (!ok) {
      window.alert('Failed to simulate acknowledgment');
    } else {
      console.log('[debug] ack successful for:', contactName);
    }
  };

  const handleReset = () => {
    escalationService.reset();
  };

  const statusColor =
    state.status === 'running' ? theme.colors.warning :
    state.status === 'acknowledged' ? theme.colors.success :
    state.status === 'cancelled' ? theme.colors.textTertiary :
    state.status === 'exhausted' ? theme.colors.emergency :
    state.status === 'error' ? theme.colors.emergency :
    theme.colors.textTertiary;

  const StatusIcon =
    state.status === 'running' ? Clock :
    state.status === 'acknowledged' ? CircleCheck :
    state.status === 'cancelled' ? X :
    state.status === 'exhausted' ? CircleAlert :
    state.status === 'error' ? CircleAlert :
    Users;

  const now = Date.now();
  const nextEscalationIn = state.nextEscalationAt ? Math.max(0, Math.ceil((state.nextEscalationAt - now) / 1000)) : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Users size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Escalation Engine
            </Text>
          </View>
          <View style={styles.statusRow}>
            <StatusIcon size={18} color={statusColor} />
            <Text variant="body" weight="medium" style={{ color: statusColor, marginLeft: 8 }}>
              {state.status.toUpperCase()}
            </Text>
          </View>
          {state.incidentId ? (
            <Text variant="caption" color="secondary">
              Incident: {state.incidentId.slice(0, 8)}...
            </Text>
          ) : null}
          {state.startedAt ? (
            <Text variant="caption" color="secondary">
              Started: {new Date(state.startedAt).toLocaleTimeString()}
            </Text>
          ) : null}
          {nextEscalationIn !== null && state.status === 'running' ? (
            <Text variant="caption" weight="bold" style={{ color: theme.colors.warning, marginTop: 4 }}>
              Next escalation in {nextEscalationIn}s
            </Text>
          ) : null}
          {state.acknowledgedBy ? (
            <View style={[styles.ackBanner, { backgroundColor: theme.colors.successSoft }]}>
              <CircleCheck size={16} color={theme.colors.success} />
              <Text variant="caption" weight="bold" style={{ color: theme.colors.success, marginLeft: 8, flex: 1 }}>
                ACKNOWLEDGED by {state.acknowledgedBy.contactName}
              </Text>
            </View>
          ) : null}
          {state.errorMessage ? (
            <View style={[styles.ackBanner, { backgroundColor: theme.colors.emergencySoft }]}>
              <CircleAlert size={16} color={theme.colors.emergency} />
              <Text variant="caption" style={{ color: theme.colors.emergency, marginLeft: 8, flex: 1 }}>
                {state.errorMessage}
              </Text>
            </View>
          ) : null}
        </Card>

        {state.status === 'idle' || state.status === 'acknowledged' || state.status === 'exhausted' || state.status === 'cancelled' ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <Play size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Start Escalation
              </Text>
            </View>
            <Text variant="caption" color="secondary" style={styles.cardHint}>
              {contacts && contacts.length > 0
                ? `Will notify ${contacts.length} emergency contact${contacts.length === 1 ? '' : 's'} in priority order (30s intervals).`
                : 'No emergency contacts found. Add contacts in the Contacts tab first.'}
            </Text>
            <View style={styles.triggerGrid}>
              <Button
                label="Minor"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => handleStart('minor')}
                loading={starting}
                disabled={starting || !contacts || contacts.length === 0}
              />
              <Button
                label="Moderate"
                variant="warning"
                size="md"
                fullWidth
                onPress={() => handleStart('moderate')}
                loading={starting}
                disabled={starting || !contacts || contacts.length === 0}
              />
              <Button
                label="Severe"
                variant="emergency"
                size="md"
                fullWidth
                onPress={() => handleStart('severe')}
                loading={starting}
                disabled={starting || !contacts || contacts.length === 0}
              />
            </View>
          </Card>
        ) : null}

        {state.contacts.length > 0 ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <Phone size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Contact Queue ({state.contacts.length})
              </Text>
            </View>
            {state.contacts.map((contact) => {
              const isCurrent = contact.priority === state.currentPriority && state.status === 'running';
              const isPast = contact.priority < state.currentPriority;
              const isFuture = contact.priority > state.currentPriority;
              const isAcked = contact.acknowledged;

              const rowColor = isAcked ? theme.colors.success :
                isCurrent ? theme.colors.warning :
                isPast ? theme.colors.textTertiary :
                theme.colors.textSecondary;

              return (
                <View
                  key={contact.contactId}
                  style={[
                    styles.contactRow,
                    { borderLeftColor: rowColor, borderLeftWidth: 3 },
                  ]}
                >
                  <View style={[styles.priorityBadge, { backgroundColor: rowColor + '20' }]}>
                    <Text variant="label" weight="bold" style={{ color: rowColor }}>
                      {contact.priority}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text variant="body" weight="medium" style={{ color: isPast || isFuture ? theme.colors.textSecondary : theme.colors.textPrimary }}>
                      {contact.contactName}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {contact.contactPhone}
                    </Text>
                    {contact.notifiedAt > 0 ? (
                      <Text variant="caption" color="tertiary">
                        Notified: {new Date(contact.notifiedAt).toLocaleTimeString()}
                      </Text>
                    ) : (
                      <Text variant="caption" color="tertiary">
                        Waiting...
                      </Text>
                    )}
                  </View>
                  {isAcked ? (
                    <View style={[styles.statusChip, { backgroundColor: theme.colors.successSoft }]}>
                      <CircleCheck size={12} color={theme.colors.success} />
                      <Text variant="caption" weight="bold" style={{ color: theme.colors.success, marginLeft: 4 }}>
                        ACK
                      </Text>
                    </View>
                  ) : isCurrent ? (
                    <View style={[styles.statusChip, { backgroundColor: theme.colors.warningSoft }]}>
                      <Clock size={12} color={theme.colors.warning} />
                      <Text variant="caption" weight="bold" style={{ color: theme.colors.warning, marginLeft: 4 }}>
                        NOW
                      </Text>
                    </View>
                  ) : isPast ? (
                    <View style={[styles.statusChip, { backgroundColor: theme.colors.surfaceAlt }]}>
                      <Text variant="caption" color="tertiary">SKIPPED</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusChip, { backgroundColor: theme.colors.surfaceAlt }]}>
                      <Text variant="caption" color="tertiary">QUEUED</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        ) : null}

        {state.status === 'running' ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <X size={20} color={theme.colors.emergency} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Actions
              </Text>
            </View>
            <Button
              label="CANCEL ESCALATION"
              variant="emergency"
              size="lg"
              fullWidth
              onPress={handleCancel}
              leftIcon={<X size={20} color={theme.colors.textOnEmergency} />}
              style={styles.actionButton}
            />
            <Text variant="caption" color="secondary" style={styles.actionHint}>
              Simulate acknowledgment (in production, contacts tap the link in SMS/email):
            </Text>
            {state.contacts.map((contact) => (
              <View key={`ack-${contact.contactId}`} style={styles.ackButtonWrap}>
                <Button
                  label={`Ack as #${contact.priority}: ${contact.contactName}`}
                  variant="outline"
                  size="sm"
                  fullWidth
                  onPress={() => handleSimulateAck(contact.contactId, contact.contactName, contact.priority)}
                  leftIcon={<UserCheck size={14} color={theme.colors.primary} />}
                />
                <Text variant="caption" color="tertiary" style={styles.ackButtonHint}>
                  {contact.contactPhone}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {state.status !== 'idle' && state.status !== 'running' ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <Button
              label="Reset"
              variant="ghost"
              size="md"
              fullWidth
              onPress={handleReset}
              leftIcon={<Play size={16} color={theme.colors.primary} />}
            />
          </Card>
        ) : null}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Phone size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              How It Works
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            <Text variant="caption" weight="bold">Escalation Sequence:{'\n'}</Text>
            1. Primary contact (priority 1) notified via SMS + email{'\n'}
            2. Wait 30s for acknowledgment{'\n'}
            3. If no ack → notify priority 2 contact{'\n'}
            4. Repeat through priority 5{'\n'}
            5. Stop when ANY contact acknowledges OR user cancels{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Acknowledgment:{'\n'}</Text>
            Each contact receives a unique web link in the SMS/email:{'\n'}
            https://resqdrive.app/ack/{'incidentId'}/{'contactId'}{'\n'}
            They tap the link → tap "Acknowledge" → updates Supabase → mobile app gets Realtime update → escalation stops.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Auto-dial (Batch 4.1):{'\n'}</Text>
            Primary contact also gets a native phone call via device dialer.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Live location (Batch 3.4):{'\n'}</Text>
            Ack link also shows victim's live GPS on a web map (no app install required).
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginLeft: 8,
  },
  cardHint: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  triggerGrid: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  actionHint: {
    marginTop: 12,
    marginBottom: 8,
  },
  ackButtonWrap: {
    marginBottom: 8,
  },
  ackButtonHint: {
    marginTop: 2,
    marginLeft: 4,
    fontSize: 10,
  },
  explainerText: {
    lineHeight: 22,
  },
});
