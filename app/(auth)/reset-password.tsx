import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "../../src/components/ui/SafeAreaView"
import { Button } from "../../src/components/ui/Button"
import { Input } from "../../src/components/ui/Input"
import { ALARAMascot } from "../../src/components/auth/ALARAMascot"
import { supabase } from "../../src/lib/supabase/client"
import { Colors, Spacing, FontSizes, BorderRadius } from "../../src/lib/utils/constants"

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0) // 0 = code, 1 = password
  const [codeVerified, setCodeVerified] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const params = useLocalSearchParams()

  useEffect(() => {
    // Get email from params if coming from forgot-password screen
    if (params?.email) {
      setEmail(params.email as string)
    } else if (!email) {
      // If no email in params and no email set, redirect to forgot-password
      // Use a small delay to avoid showing alert during navigation
      const timer = setTimeout(() => {
        router.replace("/(auth)/forgot-password")
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [params, router, email])

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code")
      return
    }

    if (!email) {
      setError("Email is required")
      return
    }

    setError("")
    setLoading(true)

    try {
      // Verify the OTP code
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: "email",
      })

      if (verifyError) {
        if (verifyError.message?.includes("expired") || verifyError.message?.includes("invalid")) {
          throw new Error("Invalid or expired code. Please request a new one.")
        }
        throw verifyError
      }

      // Code verified! Now we have a session, proceed to password reset
      setCodeVerified(true)
      setStep(1)
      setLoading(false)
    } catch (err: any) {
      console.error("Code verification error:", err)
      setError(err.message || "Invalid code. Please try again.")
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    // Validation
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setError("")
    setLoading(true)

    try {
      // Update password using the session from verified OTP
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        if (updateError.message?.includes("session") || updateError.message?.includes("expired")) {
          throw new Error("Session expired. Please request a new code.")
        }
        throw updateError
      }

      setSuccess(true)

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.replace("/(auth)/login")
      }, 2000)
    } catch (err: any) {
      console.error("Password reset error:", err)
      setError(err.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* ALARA Mascot */}
            <View style={styles.alaraContainer}>
              <ALARAMascot size={180} />
            </View>

            {/* Success Message */}
            <View style={styles.bubbleContainer}>
              <View style={styles.bubble}>
                <Text style={styles.greeting}>Password Reset! ✅</Text>
                <Text style={styles.message}>
                  Your password has been successfully reset. You can now sign in with your new password.
                </Text>
              </View>
            </View>

            <Button
              title="Go to Sign In"
              onPress={() => router.replace("/(auth)/login")}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* ALARA Mascot */}
            <View style={styles.alaraContainer}>
              <ALARAMascot size={140} />
            </View>

            {/* Conversation Bubble */}
            <View style={styles.bubbleContainer}>
              <View style={styles.bubble}>
                <Text style={styles.greeting}>
                  {step === 0 ? "Enter Verification Code 🔐" : "Reset Your Password 🔑"}
                </Text>
                <Text style={styles.message}>
                  {step === 0
                    ? `Enter the 6-digit code we sent to ${email || "your email"}.`
                    : "Enter your new password below. Make sure it's at least 6 characters long."}
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {step === 0 ? (
                <>
                  <Input
                    label=""
                    value={code}
                    onChangeText={(text) => {
                      // Only allow numbers and limit to 6 digits
                      const numericCode = text.replace(/[^0-9]/g, "").slice(0, 6)
                      setCode(numericCode)
                      setError("")
                    }}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.input, styles.codeInput]}
                    autoFocus
                  />

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.error}>{error}</Text>
                    </View>
                  ) : null}

                  <Button
                    title="Verify Code"
                    onPress={handleVerifyCode}
                    loading={loading}
                    disabled={code.length !== 6}
                    style={styles.button}
                  />

                  <TouchableOpacity
                    onPress={async () => {
                      // Resend code
                      try {
                        const { error: resendError } = await supabase.auth.signInWithOtp({
                          email: email,
                          options: {
                            shouldCreateUser: false,
                          },
                        })
                        if (resendError) throw resendError
                        Alert.alert("Code Sent!", "A new code has been sent to your email.")
                      } catch (err: any) {
                        Alert.alert("Error", err.message || "Failed to resend code.")
                      }
                    }}
                    style={styles.resendLink}
                  >
                    <Text style={styles.resendText}>
                      Didn't receive it? <Text style={styles.resendLinkText}>Resend code</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Input
                    label=""
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      setError("")
                    }}
                    placeholder="New password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                    style={styles.input}
                  />

                  <Input
                    label=""
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text)
                      setError("")
                    }}
                    placeholder="Confirm new password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                    style={styles.input}
                  />

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.error}>{error}</Text>
                    </View>
                  ) : null}

                  <Button
                    title="Reset Password"
                    onPress={handleResetPassword}
                    loading={loading}
                    style={styles.button}
                  />
                </>
              )}
            </View>

            <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.backLink}>
              <Text style={styles.backText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
  },
  alaraContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleContainer: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  bubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  errorContainer: {
    marginBottom: Spacing.sm,
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.sm,
  },
  backLink: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  backText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  codeInput: {
    textAlign: "center",
    fontSize: FontSizes.xxl,
    letterSpacing: 8,
    fontWeight: "600",
  },
  resendLink: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  resendText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  resendLinkText: {
    color: Colors.primary,
    fontWeight: "600",
  },
})
