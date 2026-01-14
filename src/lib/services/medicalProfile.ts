import { supabase } from '../supabase/client';
import type { ConditionType } from '../../types/health';

export interface SaveOnboardingDataParams {
  userId: string;
  conditionTypes: ConditionType[];
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export async function saveOnboardingData({
  userId,
  conditionTypes,
  emergencyContactName,
  emergencyContactPhone,
}: SaveOnboardingDataParams) {
  try {
    // Verify user is authenticated and get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('You must be signed in to save your information. Please sign in and try again.');
    }

    // Ensure the userId matches the authenticated user
    const authenticatedUserId = session.user.id;
    if (authenticatedUserId !== userId) {
      console.warn('UserId mismatch, using authenticated user ID');
    }
    const actualUserId = authenticatedUserId;

    console.log('Saving onboarding data for user:', actualUserId);

    // Update profile with emergency contact info
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
      })
      .eq('id', actualUserId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    // Create medical profiles for each selected condition
    const medicalProfiles = conditionTypes.map((conditionType) => ({
      user_id: actualUserId, // Use authenticated user ID for RLS
      condition_type: conditionType,
      condition_name: conditionType === 'other' ? null : getConditionName(conditionType),
    }));

    console.log('Inserting medical profiles:', medicalProfiles);

    const { data, error: medicalError } = await supabase
      .from('medical_profiles')
      .insert(medicalProfiles)
      .select();

    if (medicalError) {
      console.error('Medical profile insert error:', medicalError);
      throw medicalError;
    }

    console.log('Onboarding data saved successfully');
    return { data, error: null };
  } catch (error: any) {
    console.error('Error saving onboarding data:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('row-level security')) {
      return {
        data: null,
        error: new Error('Permission denied. Please ensure you are signed in and try again.'),
      };
    }
    
    return { data: null, error: error as Error };
  }
}

function getConditionName(conditionType: ConditionType): string {
  const names: Record<ConditionType, string> = {
    asthma: 'Asthma',
    sickle_cell_disease: 'Sickle Cell Disease',
    epilepsy: 'Epilepsy',
    diabetes: 'Diabetes',
    heart_condition: 'Heart Condition',
    allergies: 'Allergies',
    other: 'Other',
  };
  return names[conditionType];
}
