import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Text, Button, Input, Avatar, Spinner } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { EditProfileScreenProps } from '@nav/types';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@stores/auth.store';
import { profileService } from '@services/profile.service';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function EditProfileScreen(_props: EditProfileScreenProps) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cnic, setCnic] = useState(user?.cnic || '');
  const [bloodGroup, setBloodGroup] = useState(user?.blood_group || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Name is required';
    else if (fullName.trim().length < 3) next.fullName = 'Name must be at least 3 characters';
    if (!phone.trim()) next.phone = 'Phone is required';
    else if (!/^\+?[\d\s-]{10,15}$/.test(phone)) next.phone = 'Enter a valid phone number';
    if (cnic && !/^\d{5}-?\d{7}-?\d{1}$/.test(cnic)) next.cnic = 'Format: XXXXX-XXXXXXX-X';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      setUploadingAvatar(true);
      const { url, error } = await profileService.uploadAvatar(user!.id, uri);
      setUploadingAvatar(false);
      if (error) {
        setErrors({ general: error });
        setAvatarUri(user?.avatar_url || null);
        return;
      }
      if (url && user) {
        setUser({ ...user, avatar_url: url });
      }
    } catch (err) {
      setUploadingAvatar(false);
      console.warn('[edit-profile] image pick error:', err);
    }
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setSubmitting(true);
    setErrors({});
    setSuccessMsg('');
    const { user: updatedUser, error } = await profileService.updateProfile(user.id, {
      full_name: fullName.trim(),
      phone: phone.trim(),
      cnic: cnic.trim(),
      blood_group: bloodGroup,
      allergies: allergies.trim(),
    });
    setSubmitting(false);
    if (error) {
      setErrors({ general: error });
      return;
    }
    if (updatedUser) {
      setUser(updatedUser);
      setSuccessMsg('Profile updated successfully');
      setTimeout(() => _props.navigation.goBack(), 800);
    }
  };

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
          <View style={styles.avatarSection}>
            <Avatar uri={avatarUri} name={fullName} size="xl" showEditBadge onPress={handlePickImage} />
            {uploadingAvatar ? (
              <View style={styles.uploadingRow}>
                <Spinner size="small" />
                <Text variant="caption" color="secondary" style={styles.uploadingText}>
                  Uploading...
                </Text>
              </View>
            ) : (
              <Text variant="caption" color="secondary" style={styles.avatarHint}>
                Tap to change photo
              </Text>
            )}
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
            />
            <Input
              label="Phone Number"
              placeholder="+92 300 1234567"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
            />
            <Input
              label="CNIC (optional)"
              placeholder="35202-1234567-1"
              keyboardType="numeric"
              value={cnic}
              onChangeText={setCnic}
              error={errors.cnic}
              hint="Pakistani CNIC format: XXXXX-XXXXXXX-X"
            />

            <View style={styles.field}>
              <Text variant="label" weight="medium" color="primary" style={styles.fieldLabel}>
                Blood Group (optional)
              </Text>
              <View style={styles.bloodGroupGrid}>
                {BLOOD_GROUPS.map((bg) => {
                  const selected = bloodGroup === bg;
                  return (
                    <TouchableOpacity
                      key={bg}
                      onPress={() => setBloodGroup(selected ? '' : bg)}
                      style={[
                        styles.bloodGroupChip,
                        {
                          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt,
                          borderColor: selected ? theme.colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        variant="label"
                        weight="semibold"
                        style={{ color: selected ? theme.colors.textOnPrimary : theme.colors.textSecondary }}
                      >
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Input
              label="Allergies (optional)"
              placeholder="e.g. Penicillin, Peanuts"
              value={allergies}
              onChangeText={setAllergies}
              multiline
              numberOfLines={2}
              inputStyle={{ minHeight: 60 }}
              hint="For emergency medical responders"
            />

            {errors.general ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.emergencySoft }]}>
                <Text variant="caption" color="emergency">{errors.general}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={[styles.successBanner, { backgroundColor: theme.colors.successSoft }]}>
                <Text variant="caption" color="success">{successMsg}</Text>
              </View>
            ) : null}

            <Button
              label={submitting ? 'Saving...' : 'Save Changes'}
              fullWidth
              size="lg"
              onPress={handleSave}
              loading={submitting}
              disabled={submitting}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    marginLeft: 4,
  },
  avatarHint: {
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  field: {
    width: '100%',
  },
  fieldLabel: {
    marginBottom: 8,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 56,
    alignItems: 'center',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
  },
  successBanner: {
    padding: 12,
    borderRadius: 10,
  },
  saveButton: {
    marginTop: 8,
  },
});