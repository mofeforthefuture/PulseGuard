import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Typography } from '../../src/components/ui/Typography';
import { BloodPressureCard } from '../../src/components/care/BloodPressureCard';
import { BloodPressureReadingsList } from '../../src/components/care/BloodPressureReadingsList';
import { MedicalCheckupCard } from '../../src/components/care/MedicalCheckupCard';
import { DoctorVisitReminderForm } from '../../src/components/care/DoctorVisitReminderForm';
import { DoctorVisitReminderCard } from '../../src/components/care/DoctorVisitReminderCard';
import { HospitalForm } from '../../src/components/care/HospitalForm';
import { HospitalListCard } from '../../src/components/care/HospitalListCard';
import { ClinicalDateForm } from '../../src/components/care/ClinicalDateForm';
import { ClinicalDatesTimeline } from '../../src/components/care/ClinicalDatesTimeline';
import { CareLogsList } from '../../src/components/care/CareLogsList';
import { HistoryTimeline } from '../../src/components/care/HistoryTimeline';
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { useRouter } from 'expo-router';
import { Spacing } from '../../src/lib/design/tokens';
import { useColors } from '../../src/lib/design/useColors';
import { useAuth } from '../../src/context/AuthContext';
import { useALARA } from '../../src/context/ALARAContext';
import { getRecentBloodPressureReadings, getAbnormalReadingsCount } from '../../src/lib/services/bloodPressureService';
import { getMedicalCheckup } from '../../src/lib/services/checkupService';
import { getDoctorVisitReminders, createDoctorVisitReminder, completeDoctorVisitReminder, deleteDoctorVisitReminder } from '../../src/lib/services/doctorVisitReminderService';
import { getHospitals, createHospital, updateHospital, deleteHospital, setPrimaryHospital } from '../../src/lib/services/hospitalService';
import { getClinicalDates, createClinicalDate, updateClinicalDate, completeClinicalDate, deleteClinicalDate, syncClinicalDateReminders } from '../../src/lib/services/clinicalDateService';
import { getRecentCareLogs, getAllCareLogs } from '../../src/lib/services/careService';
import type { BloodPressureReading, MedicalCheckup, DoctorVisitReminder, DoctorVisitReminderInput, Hospital, HospitalInput, ClinicalDate, ClinicalDateInput, CareLog } from '../../src/types/care';

export default function CareScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const { setState, showMessage } = useALARA();
  const [bpReadings, setBpReadings] = useState<BloodPressureReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [checkup, setCheckup] = useState<MedicalCheckup | null>(null);
  const [doctorReminders, setDoctorReminders] = useState<DoctorVisitReminder[]>([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [isSavingHospital, setIsSavingHospital] = useState(false);
  const [clinicalDates, setClinicalDates] = useState<ClinicalDate[]>([]);
  const [showClinicalDateForm, setShowClinicalDateForm] = useState(false);
  const [editingClinicalDate, setEditingClinicalDate] = useState<ClinicalDate | null>(null);
  const [isSavingClinicalDate, setIsSavingClinicalDate] = useState(false);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [allCareLogs, setAllCareLogs] = useState<CareLog[]>([]);
  const [activeSection, setActiveSection] = useState<'upcoming' | 'logs' | 'history'>('upcoming');

  const loadReadings = async () => {
    if (!user?.id) {
      setLoadingReadings(false);
      return;
    }

    try {
      const readings = await getRecentBloodPressureReadings(user.id, 5);
      setBpReadings(readings);
      
      // Check for abnormal readings and flag ALARA
      const abnormalCount = await getAbnormalReadingsCount(user.id, 7);
      if (abnormalCount > 0) {
        // Gently flag ALARA - no diagnosis, just awareness
        setState('concern');
        showMessage({
          text: `I noticed ${abnormalCount} ${abnormalCount === 1 ? 'blood pressure reading' : 'blood pressure readings'} outside the normal range recently. Consider discussing this with your healthcare provider.`,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('Error loading blood pressure readings:', error);
    } finally {
      setLoadingReadings(false);
    }
  };

  const loadCheckup = async () => {
    if (!user?.id) return;

    try {
      const checkupData = await getMedicalCheckup(user.id);
      setCheckup(checkupData);
    } catch (error) {
      console.error('Error loading checkup:', error);
    }
  };

  const loadDoctorReminders = async () => {
    if (!user?.id) return;

    try {
      const reminders = await getDoctorVisitReminders(user.id, false);
      setDoctorReminders(reminders);
    } catch (error) {
      console.error('Error loading doctor reminders:', error);
    }
  };

  const loadHospitals = async () => {
    if (!user?.id) return;

    try {
      const hospitalList = await getHospitals(user.id);
      setHospitals(hospitalList);
    } catch (error) {
      console.error('Error loading hospitals:', error);
    }
  };

  const loadClinicalDates = async () => {
    if (!user?.id) return;

    try {
      const dates = await getClinicalDates(user.id, false);
      setClinicalDates(dates);
    } catch (error) {
      console.error('Error loading clinical dates:', error);
    }
  };

  const loadCareLogs = async () => {
    if (!user?.id) return;

    try {
      const logs = await getRecentCareLogs(user.id, 20);
      setCareLogs(logs);
    } catch (error) {
      console.error('Error loading care logs:', error);
    }
  };

  const loadAllCareLogs = async () => {
    if (!user?.id) return;

    try {
      const logs = await getAllCareLogs(user.id);
      setAllCareLogs(logs);
    } catch (error) {
      console.error('Error loading all care logs:', error);
    }
  };

  useEffect(() => {
    loadReadings();
    loadCheckup();
    loadDoctorReminders();
    loadHospitals();
    loadClinicalDates();
    loadCareLogs();
    if (activeSection === 'history') {
      loadAllCareLogs();
    }
  }, [user?.id, activeSection]);

  const handleReadingSaved = () => {
    loadReadings();
  };

  const handleCheckupUpdated = () => {
    loadCheckup();
  };

  const handleReminderSubmit = async (input: DoctorVisitReminderInput) => {
    if (!user?.id) return;

    setIsSavingReminder(true);
    try {
      await createDoctorVisitReminder(user.id, input);
      setShowReminderForm(false);
      loadDoctorReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleReminderComplete = async (reminderId: string) => {
    if (!user?.id) return;

    try {
      await completeDoctorVisitReminder(user.id, reminderId);
      loadDoctorReminders();
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleReminderDelete = async (reminderId: string) => {
    if (!user?.id) return;

    try {
      await deleteDoctorVisitReminder(user.id, reminderId);
      loadDoctorReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleHospitalSubmit = async (input: HospitalInput) => {
    if (!user?.id) return;

    setIsSavingHospital(true);
    try {
      if (editingHospital) {
        await updateHospital(user.id, editingHospital.id, input);
      } else {
        await createHospital(user.id, input);
      }
      setShowHospitalForm(false);
      setEditingHospital(null);
      loadHospitals();
    } catch (error) {
      console.error('Error saving hospital:', error);
    } finally {
      setIsSavingHospital(false);
    }
  };

  const handleHospitalEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setShowHospitalForm(true);
  };

  const handleHospitalDelete = async (hospitalId: string) => {
    if (!user?.id) return;

    try {
      await deleteHospital(user.id, hospitalId);
      loadHospitals();
    } catch (error) {
      console.error('Error deleting hospital:', error);
    }
  };

  const handleSetPrimaryHospital = async (hospitalId: string) => {
    if (!user?.id) return;

    try {
      await setPrimaryHospital(user.id, hospitalId);
      loadHospitals();
    } catch (error) {
      console.error('Error setting primary hospital:', error);
    }
  };

  const handleClinicalDateSubmit = async (input: ClinicalDateInput) => {
    if (!user?.id) return;

    setIsSavingClinicalDate(true);
    try {
      let result: ClinicalDate | null;
      if (editingClinicalDate) {
        result = await updateClinicalDate(user.id, editingClinicalDate.id, input);
      } else {
        result = await createClinicalDate(user.id, input);
      }
      
      if (result) {
        await syncClinicalDateReminders(user.id, result);
      }
      
      setShowClinicalDateForm(false);
      setEditingClinicalDate(null);
      loadClinicalDates();
    } catch (error) {
      console.error('Error saving clinical date:', error);
    } finally {
      setIsSavingClinicalDate(false);
    }
  };

  const handleClinicalDateEdit = (clinicalDate: ClinicalDate) => {
    setEditingClinicalDate(clinicalDate);
    setShowClinicalDateForm(true);
  };

  const handleClinicalDateComplete = async (clinicalDateId: string) => {
    if (!user?.id) return;

    try {
      await completeClinicalDate(user.id, clinicalDateId);
      loadClinicalDates();
    } catch (error) {
      console.error('Error completing clinical date:', error);
    }
  };

  const handleClinicalDateDelete = async (clinicalDateId: string) => {
    if (!user?.id) return;

    try {
      await deleteClinicalDate(user.id, clinicalDateId);
      loadClinicalDates();
    } catch (error) {
      console.error('Error deleting clinical date:', error);
    }
  };

  return (
    <SafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Typography variant="h1" color="text" weight="bold" style={styles.title}>
          Care & Appointments
        </Typography>

        {/* Section Tabs */}
        <View style={styles.tabs}>
          <Button
            title="Upcoming"
            onPress={() => setActiveSection('upcoming')}
            variant={activeSection === 'upcoming' ? 'primary' : 'outline'}
            style={styles.tabButton}
          />
          <Button
            title="Logs"
            onPress={() => setActiveSection('logs')}
            variant={activeSection === 'logs' ? 'primary' : 'outline'}
            style={styles.tabButton}
          />
          <Button
            title="History"
            onPress={() => setActiveSection('history')}
            variant={activeSection === 'history' ? 'primary' : 'outline'}
            style={styles.tabButton}
          />
        </View>

        {/* Upcoming Section */}
        {activeSection === 'upcoming' && (
          <>
            {/* Blood Pressure Card */}
            <BloodPressureCard recentReadings={bpReadings} onReadingSaved={handleReadingSaved} />

            {/* Medical Checkup Card */}
            <MedicalCheckupCard checkup={checkup} onCheckupUpdated={handleCheckupUpdated} />

            {/* Doctor Visit Reminders */}
            <DoctorVisitReminderCard
              reminders={doctorReminders}
              onComplete={handleReminderComplete}
              onDelete={handleReminderDelete}
            />
            {doctorReminders.length === 0 && (
              <Card>
                <Button
                  title="Add Doctor Visit Reminder"
                  onPress={() => setShowReminderForm(true)}
                  variant="outline"
                  style={styles.addButton}
                />
              </Card>
            )}

            {/* Clinical Dates Timeline */}
            <ClinicalDatesTimeline
              clinicalDates={clinicalDates}
              onComplete={handleClinicalDateComplete}
              onEdit={handleClinicalDateEdit}
              onDelete={handleClinicalDateDelete}
            />
            {clinicalDates.length === 0 && (
              <Card>
                <Button
                  title="Add Clinical Date"
                  onPress={() => {
                    setEditingClinicalDate(null);
                    setShowClinicalDateForm(true);
                  }}
                  variant="outline"
                  style={styles.addButton}
                />
              </Card>
            )}

            {/* Hospital Information */}
            {showHospitalForm ? (
              <HospitalForm
                hospital={editingHospital}
                onSubmit={handleHospitalSubmit}
                onCancel={() => {
                  setShowHospitalForm(false);
                  setEditingHospital(null);
                }}
                isSubmitting={isSavingHospital}
              />
            ) : (
              <HospitalListCard
                hospitals={hospitals}
                onEdit={handleHospitalEdit}
                onDelete={handleHospitalDelete}
                onSetPrimary={handleSetPrimaryHospital}
                onAddNew={() => {
                  setEditingHospital(null);
                  setShowHospitalForm(true);
                }}
              />
            )}
          </>
        )}

        {/* Logs Section */}
        {activeSection === 'logs' && (
          <>
            <Card>
              <Typography variant="h2" color="text" weight="bold" style={styles.sectionTitle}>
                Care Logs
              </Typography>
              <Typography variant="bodySmall" color="textSecondary" style={styles.sectionSubtitle}>
                Record past medical visits, procedures, and events
              </Typography>
            </Card>
            <CareLogsList careLogs={careLogs} />
            <FloatingActionButton
              onPress={() => {
                // TODO: Navigate to add care log screen
                console.log('Add care log');
              }}
              icon="+"
              label="Add Log"
            />
          </>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <HistoryTimeline careLogs={allCareLogs} />
        )}

        {/* Modals */}
        {showReminderForm && (
          <DoctorVisitReminderForm
            onSubmit={handleReminderSubmit}
            onCancel={() => setShowReminderForm(false)}
            isSubmitting={isSavingReminder}
          />
        )}

        {showClinicalDateForm && (
          <BottomSheet
            visible={showClinicalDateForm}
            onClose={() => {
              setShowClinicalDateForm(false);
              setEditingClinicalDate(null);
            }}
          >
            <ClinicalDateForm
              clinicalDate={editingClinicalDate}
              onSubmit={handleClinicalDateSubmit}
              onCancel={() => {
                setShowClinicalDateForm(false);
                setEditingClinicalDate(null);
              }}
              isSubmitting={isSavingClinicalDate}
            />
          </BottomSheet>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl, // Extra padding for floating button
  },
  title: {
    marginBottom: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    marginBottom: Spacing.md,
  },
  cardButton: {
    marginTop: Spacing.sm,
  },
  quickActionButton: {
    marginTop: Spacing.sm,
  },
  addButton: {
    marginTop: Spacing.sm,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
});
