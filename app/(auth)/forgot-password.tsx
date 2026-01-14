import React, { useState } from "react"
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "../../src/components/ui/SafeAreaView"
import { Button } from "../../src/components/ui/Button"
import { Input } from "../../src/components/ui/Input"
import { ALARAMascot } from "../../src/components/auth/ALARAMascot"
import { supabase } from "../../src/lib/supabase/client"
import { Colors, Spacing, FontSizes, BorderRadius } from "../../src/lib/utils/constants"

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const router = useRouter()

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setError("")
    setLoading(true)

    try {
      // Send OTP code via email for password recovery
      // We'll use Supabase's email OTP feature
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Don't create user if doesn't exist
          emailRedirectTo: undefined,
        },
      })

      if (otpError) {
        // If user doesn't exist, try password reset flow as fallback
        if (otpError.message?.includes("not found") || otpError.message?.includes("does not exist")) {
          // User doesn't exist, show error
          throw new Error("No account found with this email address.")
        }
        throw otpError
      }

      setCodeSent(true)
    } catch (err: any) {
      console.error("OTP send error:", err)
      setError(err.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (codeSent) {
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
                <Text style={styles.greeting}>Check Your Email! 📧</Text>
                <Text style={styles.message}>
                  We've sent a 6-digit code to{"\n"}
                  <Text style={styles.emailText}>{email}</Text>
                </Text>
                <Text style={styles.instructions}>
                  Enter the code in the app to reset your password. The code will expire in 10 minutes.
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Enter Code"
                onPress={() => {
                  router.push({
                    pathname: "/(auth)/reset-password",
                    params: { email },
                  })
                }}
                style={styles.button}
              />

              <TouchableOpacity
                onPress={() => {
                  setCodeSent(false)
                  setEmail("")
                }}
                style={styles.resendLink}
              >
                <Text style={styles.resendText}>
                  Didn't receive it? <Text style={styles.resendLinkText}>Resend code</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={styles.backLink}
              >
                <Text style={styles.backText}>← Back to Sign In</Text>
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* ALARA Mascot */}
            <View style={styles.alaraContainer}>
              <ALARAMascot size={140} />
            </View>

            {/* Conversation Bubble */}
            <View style={styles.bubbleContainer}>
              <View style={styles.bubble}>
                <Text style={styles.greeting}>Forgot Password? 🔑</Text>
                <Text style={styles.message}>
                  No worries! Enter your email address and we'll send you a 6-digit code to reset your password.
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label=""
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  setError("")
                }}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <Button
                title="Send Code"
                onPress={handleSendCode}
                loading={loading}
                style={styles.button}
              />
            </View>

            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
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
  actions: {
    width: "100%",
    marginTop: "auto",
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
