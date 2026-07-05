import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Text, Button, Input, Card } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { AddVehicleScreenProps } from '@nav/types';
import { useVehicles, useCreateVehicle, useUpdateVehicle } from '@hooks/useVehicles';
import { CreateVehicleInput } from '@services/vehicle.service';
import { Car } from 'lucide-react-native';

const CURRENT_YEAR = new Date().getFullYear() + 1;

export function AddVehicleScreen({ navigation, route }: AddVehicleScreenProps) {
  const theme = useAppTheme();
  const isEdit = !!route.params?.vehicleId;
  const vehicleId = route.params?.vehicleId;
  const { data: vehicles } = useVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const editingVehicle = vehicles?.find((v) => v.id === vehicleId);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (editingVehicle) {
      setMake(editingVehicle.make);
      setModel(editingVehicle.model);
      setYear(editingVehicle.year.toString());
      setColor(editingVehicle.color);
      setLicensePlate(editingVehicle.license_plate);
      setVin(editingVehicle.vin || '');
      setInsuranceProvider(editingVehicle.insurance_provider || '');
      setInsurancePolicyNumber(editingVehicle.insurance_policy_number || '');
      setInsuranceExpiry(editingVehicle.insurance_expiry || '');
      setIsPrimary(editingVehicle.is_primary);
    }
  }, [editingVehicle]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!make.trim()) next.make = 'Make is required';
    if (!model.trim()) next.model = 'Model is required';
    const yearNum = parseInt(year, 10);
    if (!year.trim()) next.year = 'Year is required';
    else if (isNaN(yearNum) || yearNum < 1950 || yearNum > CURRENT_YEAR) {
      next.year = `Year must be between 1950 and ${CURRENT_YEAR}`;
    }
    if (!color.trim()) next.color = 'Color is required';
    if (!licensePlate.trim()) next.licensePlate = 'License plate is required';
    if (insuranceExpiry && isNaN(Date.parse(insuranceExpiry))) {
      next.insuranceExpiry = 'Format: YYYY-MM-DD';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setGeneralError('');

    const input: CreateVehicleInput = {
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year, 10),
      color: color.trim(),
      license_plate: licensePlate.trim().toUpperCase(),
      vin: vin.trim() || undefined,
      insurance_provider: insuranceProvider.trim() || undefined,
      insurance_policy_number: insurancePolicyNumber.trim() || undefined,
      insurance_expiry: insuranceExpiry || undefined,
      is_primary: isPrimary,
    };

    try {
      if (isEdit && vehicleId) {
        await updateVehicle.mutateAsync({ id: vehicleId, updates: input });
      } else {
        await createVehicle.mutateAsync(input);
      }
      navigation.goBack();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to save vehicle');
    }
  };

  const submitting = createVehicle.isPending || updateVehicle.isPending;

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
            <View style={[styles.headerIcon, { backgroundColor: theme.colors.primarySoft }]}>
              <Car size={28} color={theme.colors.primary} />
            </View>
            <Text variant="title" weight="semibold" style={styles.headerTitle}>
              {isEdit ? 'Edit Vehicle Details' : 'Register Your Vehicle'}
            </Text>
            <Text variant="body" color="secondary">
              {isEdit ? 'Update your vehicle information below.' : 'Tell us about your vehicle for accident detection and emergency response.'}
            </Text>
          </View>

          <Card padding="md" elevation="sm" style={styles.sectionCard}>
            <Text variant="label" color="secondary" style={styles.sectionTitle}>
              VEHICLE DETAILS
            </Text>
            <View style={styles.form}>
              <Input
                label="Make"
                placeholder="e.g. Toyota, Honda, Suzuki"
                value={make}
                onChangeText={setMake}
                error={errors.make}
                autoCapitalize="words"
              />
              <Input
                label="Model"
                placeholder="e.g. Corolla, Civic, Mehran"
                value={model}
                onChangeText={setModel}
                error={errors.model}
                autoCapitalize="words"
              />
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Year"
                    placeholder="2024"
                    keyboardType="numeric"
                    value={year}
                    onChangeText={setYear}
                    error={errors.year}
                    maxLength={4}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="Color"
                    placeholder="e.g. White"
                    value={color}
                    onChangeText={setColor}
                    error={errors.color}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <Input
                label="License Plate"
                placeholder="e.g. LEA-1234"
                value={licensePlate}
                onChangeText={setLicensePlate}
                error={errors.licensePlate}
                autoCapitalize="characters"
              />
              <Input
                label="VIN (optional)"
                placeholder="17-character Vehicle ID"
                value={vin}
                onChangeText={setVin}
                error={errors.vin}
                autoCapitalize="characters"
                hint="Found on registration documents"
              />
            </View>
          </Card>

          <Card padding="md" elevation="sm" style={styles.sectionCard}>
            <Text variant="label" color="secondary" style={styles.sectionTitle}>
              INSURANCE (OPTIONAL)
            </Text>
            <View style={styles.form}>
              <Input
                label="Insurance Provider"
                placeholder="e.g. EFU, Jubilee, Adamjee"
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
                autoCapitalize="words"
              />
              <Input
                label="Policy Number"
                placeholder="Policy reference"
                value={insurancePolicyNumber}
                onChangeText={setInsurancePolicyNumber}
              />
              <Input
                label="Insurance Expiry"
                placeholder="YYYY-MM-DD"
                value={insuranceExpiry}
                onChangeText={setInsuranceExpiry}
                error={errors.insuranceExpiry}
                hint="Format: YYYY-MM-DD"
              />
            </View>
          </Card>

          {!isEdit ? (
            <Card padding="md" elevation="sm" style={styles.sectionCard}>
              <View style={styles.primaryRow}>
                <View style={styles.primaryInfo}>
                  <Text variant="body" weight="medium">
                    Set as primary vehicle
                  </Text>
                  <Text variant="caption" color="secondary">
                    Used by default for accident detection
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsPrimary((v) => !v)}
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surfaceAlt,
                      borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      { backgroundColor: isPrimary ? '#FFFFFF' : theme.colors.textTertiary },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </Card>
          ) : null}

          {generalError ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.colors.emergencySoft }]}>
              <Text variant="caption" color="emergency">{generalError}</Text>
            </View>
          ) : null}

          <Button
            label={submitting ? 'Saving...' : (isEdit ? 'Update Vehicle' : 'Add Vehicle')}
            fullWidth
            size="lg"
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

import { TouchableOpacity } from 'react-native';

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
  sectionCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  form: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignSelf: 'flex-end',
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