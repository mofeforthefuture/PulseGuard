/**
 * Daily Check-In Tracker
 * Tracks when ALARA last asked for a check-in and determines if a new one is needed
 */

import { supabase } from "../supabase/client"

export interface CheckInStatus {
  needsCheckIn: boolean
  lastCheckInDate?: string
  daysSinceLastCheckIn: number
  missingData: {
    mood: boolean
    medications: boolean
    doctorVisit: boolean
  }
}

/**
 * Check if user needs a daily check-in
 */
export async function checkIfCheckInNeeded(userId: string): Promise<CheckInStatus> {
  try {
    const today = new Date().toISOString().split("T")[0]

    // Check if there's a check-in for today
    const { data: todayCheckIn } = await supabase
      .from("check_ins")
      .select("date, mood, medication_taken, notes")
      .eq("user_id", userId)
      .eq("date", today)
      .single()

    // Check last check-in date
    const { data: lastCheckIn } = await supabase
      .from("check_ins")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1)
      .single()

    const lastCheckInDate = lastCheckIn?.date
    const daysSinceLastCheckIn = lastCheckInDate
      ? Math.floor(
          (new Date(today).getTime() - new Date(lastCheckInDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 999 // Never checked in

    // Determine what's missing
    const missingData = {
      mood: !todayCheckIn?.mood,
      medications: todayCheckIn?.medication_taken === undefined || todayCheckIn?.medication_taken === null,
      doctorVisit: false, // We'll check health_entries for doctor visits
    }

    // Check for doctor visits in health_entries (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: recentHealthEntries } = await supabase
      .from("health_entries")
      .select("entry_type, data, created_at")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .or("entry_type.eq.note,entry_type.eq.symptom")

    // Check if there's a doctor visit mentioned in notes
    const hasDoctorVisit = recentHealthEntries?.some((entry) => {
      const data = entry.data as any
      const text = JSON.stringify(data).toLowerCase()
      return (
        text.includes("doctor") ||
        text.includes("appointment") ||
        text.includes("visit") ||
        text.includes("clinic") ||
        text.includes("hospital")
      )
    })

    missingData.doctorVisit = !hasDoctorVisit && daysSinceLastCheckIn >= 7

    // Need check-in if:
    // 1. No check-in today AND it's been at least 1 day since last check-in
    // 2. Missing critical data (mood, medications)
    const needsCheckIn =
      (!todayCheckIn && daysSinceLastCheckIn >= 1) ||
      (todayCheckIn && (missingData.mood || missingData.medications))

    return {
      needsCheckIn,
      lastCheckInDate: lastCheckInDate || undefined,
      daysSinceLastCheckIn,
      missingData,
    }
  } catch (error) {
    console.error("[CheckIn] Error checking check-in status:", error)
    // Default to needing check-in if we can't determine
    return {
      needsCheckIn: true,
      daysSinceLastCheckIn: 999,
      missingData: {
        mood: true,
        medications: true,
        doctorVisit: false,
      },
    }
  }
}

/**
 * Get a natural check-in prompt based on what's missing
 */
export function getCheckInPrompt(
  checkInStatus: CheckInStatus,
  personality: string,
): string | null {
  if (!checkInStatus.needsCheckIn) {
    return null
  }

  const prompts: string[] = []

  // Build natural prompts based on what's missing
  if (checkInStatus.missingData.mood) {
    prompts.push("how are you feeling today")
  }

  if (checkInStatus.missingData.medications) {
    prompts.push("have you taken your medications")
  }

  if (checkInStatus.missingData.doctorVisit && checkInStatus.daysSinceLastCheckIn >= 7) {
    prompts.push("have you visited the doctor lately")
  }

  if (prompts.length === 0) {
    return null
  }

  // Return a natural way to ask based on personality
  const friendlyWays = [
    `Hey, quick check-in: ${prompts.join(", ")}?`,
    `Just checking in - ${prompts.join(", ")}?`,
    `How's it going? ${prompts.join(", ")}?`,
  ]

  return friendlyWays[Math.floor(Math.random() * friendlyWays.length)]
}
