import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Screen, Text, Button, Input, Card } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { AddContactScreenProps } from '@nav/types';
import { useContacts, useCreateContact, useUpdateContact } from '@hooks/useContacts';
import { MAX_EMERGENCY_CONTACTS } from '@services/contact.service';
import { CreateContactInput } from '@services/contact.service';
import { Phone } from 'lucide-react-native';

const RELATIONSHIPS = ['Parent', 'Sibling', 'Spouse', 'Child', 'Relative', 'Friend', 'Doctor', 'Other'];

export function AddContactScreen({ navigation, route }: AddContactScreenProps) {
  const theme = useAppTheme();
  const isEdit = !!route.params?.contactId;
  const contactId = route.params?.contactId;
  const { data: contacts } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const editingContact = contacts?.find((c) => c.id === contactId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [priority, setPriority] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setPhone(editingContact.phone);
      setEmail(editingContact.email || '');
      setRelationship(editingContact.relationship || '');
      setPriority(editingContact.priority);
    } else {
      const nextPriority = Math.min((contacts?.length || 0) + 1, MAX_EMERGENCY_CONTACTS);
      setPriority(nextPriority);
    }
  }, [editingContact, contacts?.length]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required';
    else if (name.trim().length < 2) next.name = 'Name too short';
    if (!phone.trim()) next.phone = 'Phone is required';
    else if (!/^\+?[\d\s-]{10,15}$/.test(phone)) next.phone = 'Enter a valid phone number';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setGeneralError('');

    const input: CreateContactInput = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      relationship: relationship || undefined,
      priority,
    };

    try {
      if (isEdit && contactId) {
        await updateContact.mutateAsync({ id: contactId, updates: input });
      } else {
        await createContact.mutateAsync(input);
      }
      navigation.goBack();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to save contact');
    }
  };

  const submitting = createContact.isPending || updateContact.isPending;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: theme.colors.emergencySoft }]}>
              <Phone size={28} color={theme.colors.emergency} />
            </View>
            <Text variant="title" weight="semibold" style={styles.headerTitle}>
              {isEdit ? 'Edit Contact' : 'Add Emergency Contact'}
            </Text>
            <Text variant="body" color="secondary">
              {isEdit
                ? 'Update contact information below.'
                : 'This person will be notified if an accident is detected.'}
            </Text>
          </View>

          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.form}>
              <Input
                label="Full Name"
                placeholder="e.g. John Doe"
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoCapitalize="words"
              />
              <Input
                label="Phone Number"
                placeholder="+92 300 1234567"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
                hint="Include country code for SMS alerts"
              />
              <Input
                label="Email (optional)"
                placeholder="contact@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
              />

              <View style={styles.field}>
                <Text variant="label" weight="medium" color="primary" style={styles.fieldLabel}>
                  Relationship (optional)
                </Text>
                <View style={styles.chipGrid}>
                  {RELATIONSHIPS.map((rel) => {
                    const selected = relationship === rel;
                    return (
                      <TouchableOpacity
                        key={rel}
                        onPress={() => setRelationship(selected ? '' : rel)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt,
                            borderColor: selected ? theme.colors.primary : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          variant="label"
                          weight="medium"
                          style={{
                            color: selected ? theme.colors.textOnPrimary : theme.colors.textSecondary,
                          }}
                        >
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text variant="label" weight="medium" color="primary" style={styles.fieldLabel}>
                  Priority (notification order)
                </Text>
                <View style={styles.priorityGrid}>
                  {Array.from({ length: MAX_EMERGENCY_CONTACTS }, (_, i) => i + 1).map((p) => {
                    const selected = priority === p;
                    const used = !isEdit && contacts?.some((c) => c.priority === p) && !editingContact;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => !used && setPriority(p)}
                        disabled={used}
                        style={[
                          styles.priorityChip,
                          {
                            backgroundColor: selected
                              ? p === 1
                                ? theme.colors.emergency
                                : theme.colors.primary
                              : theme.colors.surfaceAlt,
                            opacity: used ? 0.4 : 1,
                          },
                        ]}
                      >
                        <Text
                          variant="body"
                          weight="bold"
                          style={{
                            color: selected ? theme.colors.textOnPrimary : theme.colors.textSecondary,
                          }}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text variant="caption" color="secondary" style={styles.priorityHint}>
                  Priority 1 = primary contact (notified first). Others follow at 30-second intervals.
                </Text>
              </View>
            </View>
          </Card>

          {generalError ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.colors.emergencySoft }]}>
              <Text variant="caption" color="emergency">{generalError}</Text>
            </View>
          ) : null}

          <Button
            label={submitting ? 'Saving...' : (isEdit ? 'Update Contact' : 'Add Contact')}
            fullWidth
            size="lg"
            variant="emergency"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    marginBottom: 4,
    textAlign: 'center',
  },
  card: {
    marginBottom: 12,
  },
  form: {
    gap: 12,
  },
  field: {
    width: '100%',
  },
  fieldLabel: {
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityHint: {
    marginTop: 8,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 8,
  },
});