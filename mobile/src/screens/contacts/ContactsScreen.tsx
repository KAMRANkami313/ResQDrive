import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Screen, Text, Card, Button, EmptyState, Spinner } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { ContactsScreenProps } from '@nav/types';
import { useContacts, useDeleteContact } from '@hooks/useContacts';
import { MAX_EMERGENCY_CONTACTS } from '@services/contact.service';
import { confirmDialog } from '@utils/confirm';
import { EmergencyContact } from '@app-types/index';
import { Phone, Plus, Trash2, Pencil, Mail, User, Star } from 'lucide-react-native';

export function ContactsScreen({ navigation }: ContactsScreenProps) {
  const theme = useAppTheme();
  const { data: contacts, isLoading, refetch, isRefetching } = useContacts();
  const deleteContact = useDeleteContact();

  const handleDelete = (contact: EmergencyContact) => {
    confirmDialog(
      'Delete Contact',
      `Delete ${contact.name}? They will no longer receive emergency alerts.`,
      async () => {
        await deleteContact.mutateAsync(contact.id);
      },
      'Delete',
      'Cancel',
    );
  };

  const renderItem = ({ item, index }: { item: EmergencyContact; index: number }) => (
    <Card padding="md" elevation="sm" style={styles.card}>
      <View style={styles.cardContent}>
        <View style={[styles.priorityBadge, {
          backgroundColor: index === 0 ? theme.colors.emergency : theme.colors.primarySoft,
        }]}>
          <Text variant="label" weight="bold" color={index === 0 ? 'onEmergency' : 'brand'}>
            {item.priority}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <View style={styles.contactHeader}>
            <Text variant="body" weight="semibold" style={styles.contactName}>
              {item.name}
            </Text>
            {index === 0 ? (
              <View style={[styles.primaryTag, { backgroundColor: theme.colors.emergencySoft }]}>
                <Star size={10} color={theme.colors.emergency} />
                <Text variant="caption" weight="bold" style={{ color: theme.colors.emergency, marginLeft: 3 }}>
                  PRIMARY
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="secondary">
            {item.relationship || 'Contact'}
          </Text>
          <View style={styles.contactMeta}>
            <View style={styles.metaRow}>
              <Phone size={12} color={theme.colors.textTertiary} />
              <Text variant="caption" color="secondary" style={styles.metaText}>
                {item.phone}
              </Text>
            </View>
            {item.email ? (
              <View style={styles.metaRow}>
                <Mail size={12} color={theme.colors.textTertiary} />
                <Text variant="caption" color="secondary" style={styles.metaText}>
                  {item.email}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddContact', { contactId: item.id })}
            style={styles.iconButton}
          >
            <Pencil size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.iconButton}
          >
            <Trash2 size={16} color={theme.colors.emergency} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  const count = contacts?.length || 0;
  const canAddMore = count < MAX_EMERGENCY_CONTACTS;

  if (count === 0) {
    return (
      <Screen>
        <View style={styles.container}>
          <EmptyState
            icon={<Phone size={40} color={theme.colors.emergency} />}
            title="No emergency contacts"
            message={`Add up to ${MAX_EMERGENCY_CONTACTS} emergency contacts. They'll be notified instantly if an accident is detected.`}
            actionLabel="Add Contact"
            actionVariant="emergency"
            onAction={() => navigation.navigate('AddContact', {})}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="title" weight="semibold">
              Emergency Contacts
            </Text>
            <Text variant="caption" color="secondary">
              {count} of {MAX_EMERGENCY_CONTACTS} contacts
            </Text>
          </View>
          {canAddMore ? (
            <Button
              label="Add"
              variant="emergency"
              size="sm"
              onPress={() => navigation.navigate('AddContact', {})}
              leftIcon={<Plus size={16} color={theme.colors.textOnEmergency} />}
            />
          ) : null}
        </View>

        <Card padding="md" elevation="sm" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <User size={16} color={theme.colors.primary} />
            <Text variant="caption" color="secondary" style={styles.infoText}>
              Primary contact is notified first. Others are alerted at 30-second intervals if no acknowledgement.
            </Text>
          </View>
        </Card>

        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  infoCard: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  contactName: {
    flex: 1,
  },
  primaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  contactMeta: {
    marginTop: 6,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
});