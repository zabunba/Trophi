import { theme } from "../assets/theme";
import React, { useState, useRef } from "react";
import { t } from "../assets/lang";
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity, Platform,
    KeyboardAvoidingView, Animated, Linking, Alert, ScrollView
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import * as Notifications from "expo-notifications";
import { patchSettings } from "../dev";
import { normalize } from "../dev";
import { fontSize } from "../dev";

// rendered outside NavigationContainer so no navigation prop needed
export default function OnboardingScreen({ onComplete }) {
    const s = get_s();

    const [currentStep, setCurrentStep] = useState(0);
    const [name, setName] = useState("");
    const [camPermission, requestCamPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateTransition = (callback) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            callback();
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }).start();
        });
    };

    const handleNameSubmit = () => {
        if (name.trim().length === 0) return;
        animateTransition(() => setCurrentStep(1));
    };

    const handlePermissions = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        if (!camPermission?.granted) {
            const camRes = await requestCamPermission();
            if (!camRes.granted) {
                setTimeout(() => {
                    Alert.alert(
                        t("camera_access_required"),
                        t("camera_access_desc"),
                        [
                            { text: t("go_back"), style: "cancel", onPress: () => { setIsProcessing(false); animateTransition(() => setCurrentStep(0)); } },
                            { text: t("open_settings"), onPress: () => { setIsProcessing(false); Linking.openSettings(); } }
                        ]
                    );
                }, 800);
                return;
            }
        }

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
            setTimeout(() => {
                Alert.alert(
                    t("notifications_disabled"),
                    t("notifications_disabled_desc"),
                    [{ text: t("continue_anyway"), onPress: () => { setIsProcessing(false); animateTransition(() => setCurrentStep(2)); } }]
                );
            }, 800);
            return;
        }

        setIsProcessing(false);
        animateTransition(() => setCurrentStep(2));
    };

    const handleBatterySetup = () => {
        if (Platform.OS === "android") {
            Alert.alert(
                t("unrestricted_battery_access"),
                t("unrestricted_battery_desc"),
                [
                    { text: t("skip"), style: "cancel", onPress: () => animateTransition(() => setCurrentStep(3)) },
                    {
                        text: t("open_settings"), onPress: async () => {
                            await Linking.openSettings();
                            animateTransition(() => setCurrentStep(3));
                        }
                    }
                ]
            );
        } else {
            animateTransition(() => setCurrentStep(3));
        }
    };

    // step 4: finish onboarding
    const handleFinish = async () => {
        await patchSettings({
            name: name.trim(),
            isFirstLaunch: false
        });

        // App.js handles navigation to Home via the ref
        if (onComplete) {
            onComplete();
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return renderNameStep();
            case 1: return renderPermissionsStep();
            case 2: return renderBatteryStep();
            case 3: return renderSuccessStep();
            default: return null;
        }
    };

    const renderNameStep = () => (
        <View style={s.stepContainer}>
            <View style={s.iconBox}>
                <Ionicons name="leaf" size={normalize(60)} color={theme().primary} />
            </View>
            <Text style={s.title}>{t("welcome_to_foodfetch")}</Text>
            <Text style={s.description}>{t("your_smart_assistant_for_food_inventory_")}</Text>

            <View style={s.inputContainer}>
                <Text style={s.label}>{t("what_should_we_call_you")}</Text>
                <TextInput
                    style={s.input}
                    placeholder={t("enter_your_name")}
                    placeholderTextColor={theme().textMuted}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                />
            </View>

            <TouchableOpacity
                style={[s.button, name.trim().length === 0 && s.buttonDisabled]}
                onPress={handleNameSubmit}
                disabled={name.trim().length === 0}
            >
                <Text style={s.buttonText}>{t("continue")}</Text>
                <Ionicons name="arrow-forward" size={normalize(20)} color={theme().bg} />
            </TouchableOpacity>
        </View>
    );

    const renderPermissionsStep = () => (
        <View style={s.stepContainer}>
            <View style={s.iconBox}>
                <Ionicons name="shield-checkmark" size={normalize(60)} color={theme().primary} />
            </View>
            <Text style={s.title}>{t("enable_core_features")}</Text>
            <Text style={s.description}>{t("we_need_a_couple_of_permissions_to_make_")}</Text>

            <View style={s.card}>
                <View style={s.cardIcon}>
                    <Ionicons name="camera" size={normalize(24)} color={theme().primary} />
                </View>
                <View style={s.cardText}>
                    <Text style={s.cardTitle}>{t("camera_access")}</Text>
                    <Text style={s.cardDesc}>{t("to_scan_barcodes_and_read_expiration_dat")}</Text>
                </View>
            </View>

            <View style={s.card}>
                <View style={s.cardIcon}>
                    <Ionicons name="notifications" size={normalize(24)} color={theme().primary} />
                </View>
                <View style={s.cardText}>
                    <Text style={s.cardTitle}>{t("notifications")}</Text>
                    <Text style={s.cardDesc}>{t("to_alert_you_before_your_food_expires")}</Text>
                </View>
            </View>

            <TouchableOpacity style={[s.button, isProcessing && s.buttonDisabled]} onPress={handlePermissions} disabled={isProcessing}>
                <Text style={s.buttonText}>{isProcessing ? "..." : t("grant_permissions")}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderBatteryStep = () => (
        <View style={s.stepContainer}>
            <View style={s.iconBox}>
                <Ionicons name="flash" size={normalize(60)} color={theme().primary} />
            </View>
            <Text style={s.title}>{t("stay_connected")}</Text>
            <Text style={s.description}>
                {Platform.OS === "android"
                    ? t("android_battery_desc")
                    : t("ios_battery_desc")}
            </Text>

            <View style={s.card}>
                <View style={s.cardIcon}>
                    <Ionicons name="battery-charging" size={normalize(24)} color={theme().primary} />
                </View>
                <View style={s.cardText}>
                    <Text style={s.cardTitle}>{t("battery_optimization")}</Text>
                    <Text style={s.cardDesc}>
                        {Platform.OS === "android"
                            ? t("android_battery_card")
                            : t("ios_battery_card")}
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={s.button} onPress={handleBatterySetup}>
                <Text style={s.buttonText}>
                    {Platform.OS === "android" ? t("configure_battery") : t("continue")}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderSuccessStep = () => (
        <View style={s.stepContainer}>
            <View style={s.iconBox}>
                <Ionicons name="checkmark-circle" size={normalize(80)} color={theme().primary} />
            </View>
            <Text style={s.title}>{t("you_re_all_set")} {name}!</Text>
            <Text style={s.description}>{t("your_smart_kitchen_is_ready_let_s_start_")}</Text>

            <TouchableOpacity style={s.button} onPress={handleFinish}>
                <Text style={s.buttonText}>{t("start_using_foodfetch")}</Text>
                <Ionicons name="rocket" size={normalize(20)} color={theme().bg} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme().bg }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.main}>
                <ExpoStatusBar style="light" />

                <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                    <Animated.View style={[s.content, { opacity: fadeAnim }]}>
                        {renderStep()}
                    </Animated.View>
                </ScrollView>

                <View style={s.pagination}>
                    {[0, 1, 2, 3].map((step) => (
                        <View
                            key={step}
                            style={[s.dot, currentStep === step && s.dotActive]}
                        />
                    ))}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
function get_s() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg },
        scrollContent: { flexGrow: 1, justifyContent: "center" },
        content: { flex: 1, justifyContent: "center", padding: normalize(24) },
        stepContainer: { alignItems: "center", width: "100%" },
        iconBox: { width: normalize(100), height: normalize(100), borderRadius: normalize(50), backgroundColor: theme().cardBg, justifyContent: "center", alignItems: "center", marginBottom: normalize(24), borderWidth: 1, borderColor: "#10f5a233" },
        title: { fontFamily: "Poppins_700Bold", fontSize: fontSize(6), color: theme().text, textAlign: "center", marginBottom: normalize(12), lineHeight: fontSize(7.5) },
        description: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(3.5), color: theme().textMuted, textAlign: "center", marginBottom: normalize(32), lineHeight: fontSize(5), paddingHorizontal: normalize(10) },
        inputContainer: { width: "100%", marginBottom: normalize(24) },
        label: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(3.2), color: theme().textMuted, marginBottom: normalize(8), marginLeft: normalize(4) },
        input: { width: "100%", backgroundColor: theme().cardBg, color: theme().text, fontFamily: "Poppins_600SemiBold", fontSize: fontSize(4), padding: normalize(16), borderRadius: normalize(12), borderWidth: 1, borderColor: theme().border },
        card: { flexDirection: "row", backgroundColor: theme().cardBg, padding: normalize(16), borderRadius: normalize(12), alignItems: "center", marginBottom: normalize(12), width: "100%", borderWidth: 1, borderColor: theme().cardBg },
        cardIcon: { width: normalize(44), height: normalize(44), borderRadius: normalize(10), backgroundColor: "#10f5a215", justifyContent: "center", alignItems: "center", marginRight: normalize(12) },
        cardText: { flex: 1 },
        cardTitle: { fontFamily: "Poppins_700Bold", fontSize: fontSize(3.5), color: theme().text, marginBottom: normalize(2) },
        cardDesc: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(2.8), color: theme().textMuted, lineHeight: fontSize(4) },
        button: { flexDirection: "row", backgroundColor: theme().primary, paddingVertical: normalize(16), paddingHorizontal: normalize(30), borderRadius: normalize(12), alignItems: "center", gap: normalize(10), width: "100%", justifyContent: "center", marginTop: normalize(16) },
        buttonDisabled: { backgroundColor: theme().cardBg },
        buttonText: { fontFamily: "Poppins_700Bold", fontSize: fontSize(4), color: theme().bg },
        pagination: { flexDirection: "row", justifyContent: "center", paddingBottom: normalize(40), gap: normalize(8), alignItems: "center" },
        dot: { width: normalize(8), height: normalize(8), borderRadius: normalize(4), backgroundColor: theme().border },
        dotActive: { backgroundColor: theme().primary, width: normalize(24) }
    });
}