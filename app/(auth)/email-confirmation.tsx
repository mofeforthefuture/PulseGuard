import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "../../src/components/ui/SafeAreaView"
import { Button } from "../../src/components/ui/Button"
import { Input } from "../../src/components/ui/Input"
import { ALARAMascot } from "../../src/components/auth/ALARAMascot"
import { supabase } from "../../src/lib/supabase/client"
import { useAuth } from "../../src/context/AuthContext"
import { Colors, Spacing, FontSizes, BorderRadius } from "../../src/lib/utils/constants"

export default function EmailConfirmationScreen() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [checking, setChecking] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const params = useLocalSearchParams()

  useEffect(() => {
    // Get email from user or params
    if (params?.email) {
      setEmail(params.email as string)
      setCodeSent(true) // Code was already sent from signup
    } else if (user?.email) {
      setEmail(user.email)
    }

    // Listen for auth state changes (e.g., when user verifies code)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email_confirmed_at)

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Get fresh user data
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (currentUser?.email_confirmed_at) {
          // Email confirmed, go to onboarding
          console.log("Email confirmed via auth state change!")
          router.replace("/(auth)/onboarding")
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user, router, params])

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code from your email.")
      return
    }

    if (!email) {
      Alert.alert("Error", "Email address not found. Please sign up again.")
      return
    }

    setChecking(true)

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

      // Code verified! User is now authenticated
      if (data.session && data.user) {
        // Check if email is confirmed
        if (data.user.email_confirmed_at) {
          // Navigate to onboarding
          router.replace("/(auth)/onboarding")
        } else {
          // Email might not be confirmed yet, but session exists
          // Wait a moment and check again
          setTimeout(() => {
            router.replace("/(auth)/onboarding")
          }, 500)
        }
      }
    } catch (error: any) {
      console.error("Code verification error:", error)
      Alert.alert("Error", error.message || "Invalid code. Please try again.")
      setChecking(false)
    }
  }

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Email address not found. Please sign up again.")
      return
    }

    try {
      console.log("Sending verification code to:", email)

      // For signup verification, use resend with signup type
      // This sends the proper signup confirmation email (which can be OTP if configured)
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: undefined,
        },
      })

      if (resendError) {
        console.error("Resend error:", resendError)

        // Fallback: try OTP (though it might send recovery email)
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: undefined,
          },
        })

        if (otpError) {
          console.error("OTP fallback error:", otpError)
          throw new Error(
            otpError.message ||
              "Failed to send code. Please check your Supabase email settings or try again later.",
          )
        } else {
          console.log("OTP sent as fallback")
        }
      } else {
        console.log("Verification email sent successfully")
      }

      setCodeSent(true)
      Alert.alert(
        "Code Sent! 📧",
        "We've sent a 6-digit code to your email. Please check your inbox (and spam folder).",
      )
    } catch (error: any) {
      console.error("Send code error:", error)
      Alert.alert(
        "Error Sending Code",
        error.message ||
          "Failed to send code. Please check:\n\n• Your email address is correct\n• Supabase email is configured\n• Check spam folder\n\nYou can try again or contact support.",
      )
    }
  }

  if (!codeSent) {
    // Show code request screen
    return (
      <SafeAreaView>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* ALARA Mascot */}
            <View style={styles.alaraContainer}>
              <ALARAMascot size={180} />
            </View>

            {/* Conversation Bubble */}
            <View style={styles.bubbleContainer}>
              <View style={styles.bubble}>
                <Text style={styles.greeting}>Verify Your Email! 📧</Text>
                <Text style={styles.message}>
                  We need to verify your email address. We'll send a 6-digit code to{"\n"}
                  <Text style={styles.emailText}>{email || "your email"}</Text>
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Send Verification Code"
                onPress={handleSendCode}
                style={styles.button}
              />

              <TouchableOpacity
                onPress={async () => {
                  await signOut()
                  router.replace("/(auth)/signup")
                }}
                style={styles.signOutLink}
              >
                <Text style={styles.signOutText}>Sign up with a different email</Text>
              </TouchableOpacity>
            </View>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* ALARA Mascot */}
            <View style={styles.alaraContainer}>
              <ALARAMascot size={180} />
            </View>

            {/* Conversation Bubble */}
            <View style={styles.bubbleContainer}>
              <View style={styles.bubble}>
                <Text style={styles.greeting}>Enter Verification Code 🔐</Text>
                <Text style={styles.message}>
                  We've sent a 6-digit code to{"\n"}
                  <Text style={styles.emailText}>{email || "your email"}</Text>
                </Text>
                <Text style={styles.instructions}>
                  Enter the code below to verify your email and continue setting up your profile.
                </Text>
              </View>
            </View>

            {/* Code Input */}
            <View style={styles.form}>
              <Input
                label=""
                value={code}
                onChangeText={(text) => {
                  // Only allow numbers and limit to 6 digits
                  const numericCode = text.replace(/[^0-9]/g, "").slice(0, 6)
                  setCode(numericCode)
                }}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, styles.codeInput]}
                autoFocus
              />

              <Button
                title="Verify Code"
                onPress={handleVerifyCode}
                loading={checking}
                disabled={code.length !== 6}
                style={styles.button}
              />

              <TouchableOpacity onPress={handleSendCode} style={styles.resendLink}>
                <Text style={styles.resendText}>
                  Didn't receive it? <Text style={styles.resendLinkText}>Resend code</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await signOut()
                  router.replace("/(auth)/signup")
                }}
                style={styles.signOutLink}
              >
                <Text style={styles.signOutText}>Sign up with a different email</Text>
              </TouchableOpacity>
            </View>
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
  form: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  codeInput: {
    textAlign: "center",
    fontSize: FontSizes.xxl,
    letterSpacing: 8,
    fontWeight: "600",
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
    marginBottom: Spacing.md,
  },
  emailText: {
    fontWeight: "600",
    color: Colors.primary,
  },
  instructions: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  actions: {
    width: "100%",
    marginTop: "auto",
  },
  button: {
    marginBottom: Spacing.md,
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
  signOutLink: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  signOutText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
})
