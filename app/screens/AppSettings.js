import { theme, getThemeId } from "../assets/theme";
import { StyleSheet, View, Text, Platform, StatusBar, TouchableOpacity, Animated, ScrollView, DeviceEventEmitter, Alert } from "react-native";
import { t } from "../assets/lang";
import { useState, useRef, useEffect } from "react";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { navBarHeight, fontSize, normalize, deleteAllProducts, clearSettings } from "../dev";
import DietaryOption from "./settings/Dietary";
import AboutOption from "./settings/About";
import ExpirationAlertsOption from "./settings/ExpirationAlerts";
import LicenseOption from "./settings/License";
import AppPreferencesOption from "./settings/AppPreference";


function changeScreen(path, goBack, setTitle) {

    switch (path) {
        case "/dietary":
            return (
                <DietaryOption backProp={goBack} titleChange={setTitle} />
            );
        case "/apppreferences":
            return (
                <AppPreferencesOption backProp={goBack} titleChange={setTitle} />
            );
        case "/notifications":
            return (
                <ExpirationAlertsOption backProp={goBack} titleChange={setTitle} />
            );
        case "/license":
            return (
                <LicenseOption backProp={goBack} titleChange={setTitle} />
            );
        case "/about":
            return (
                <AboutOption backProp={goBack} titleChange={setTitle} />
            );
        default:
            throw new Error("Unexpected error!");
    }

}

export default function Home() {
    const stylec = get_stylec();

    const [fontsLoaded, error] = useFonts({
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    const [title, setTitle] = useState(t("settings"));

    const slideAnim = useRef(new Animated.Value(0)).current;

    const [currentPath, setCurrentPath] = useState(null);
    const opacity = useRef(new Animated.Value(1)).current;
    const [localThemeKey, setLocalThemeKey] = useState(0);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener("theme_changed", () => setLocalThemeKey(k => k + 1));
        return () => sub.remove();
    }, []);

    const navigateTo = (path) => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setCurrentPath(path);
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    const goBack = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setCurrentPath(null);
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    if (!fontsLoaded) return (
        <View style={{ justifyContent: "center", backgroundColor: theme().textMuted }}>
            <Text>{t("couldnt_load_font")}</Text>
        </View>
    );

    return (
        <View style={stylec.main}>
            <ExpoStatusBar style={getThemeId() === "light" ? "dark" : "light"} />
            {currentPath !== null && (
                <View style={stylec.header}>
                    <Text style={stylec.greetingsText}>{title}</Text>
                </View>
            )}
            <View style={stylec.body}>
                <Animated.View style={{ flex: 1, opacity }}>
                    {currentPath != null ? (
                        (changeScreen(currentPath, goBack, setTitle))
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(40), paddingHorizontal: normalize(15), paddingTop: normalize(10) }}>
                            <View style={stylec.profileHeader}>
                                <Text style={stylec.profileName}>{t("settings")}</Text>
                                <Text style={stylec.profileSub}>Manage your Trophi</Text>
                            </View>

                            {[
                                {
                                    title: "Preferences",
                                    items: [
                                        { id: "dietary", name: t("dietary_preferences"), desc: "Allergies & diets", path: "/dietary", icon: "restaurant-menu", color: "#f5a210" },
                                        { id: "preferences", name: t("app_preferences"), desc: "Theme & language", path: "/apppreferences", icon: "palette", color: theme().primary },
                                        { id: "notifications", name: t("expiration_alerts"), desc: "Manage alert times", path: "/notifications", icon: "notifications-active", color: "#e53935" },
                                    ]
                                },
                                {
                                    title: "Legal & Info",
                                    items: [
                                        { id: "license", name: t("tos_and_license"), desc: "Terms of service", path: "/license", icon: "gavel", color: "#8e8e93" },
                                        { id: "about", name: t("about"), desc: "App version & info", path: "/about", icon: "info", color: "#007aff" },
                                        { id: "reset", name: t("reset_app") || "Factory Reset", desc: "Clear all data and restart", path: "ACTION_RESET", icon: "delete-forever", color: theme().danger || "#ff4444" },
                                    ]
                                }
                            ].map((section, idx) => (
                                <View key={idx} style={stylec.section}>
                                    <Text style={stylec.sectionTitle}>{section.title}</Text>
                                    <View style={stylec.cardGroup}>
                                        {section.items.map((item, i) => (
                                            <View key={item.id}>
                                                <TouchableOpacity style={stylec.btn} onPress={() => {
                                                    if (item.path === "ACTION_RESET") {
                                                        Alert.alert(
                                                            "Factory Reset",
                                                            "Are you sure you want to completely reset the app? This will permanently delete all your products, settings, and local data.",
                                                            [
                                                                { text: "Cancel", style: "cancel" },
                                                                {
                                                                    text: "Reset",
                                                                    style: "destructive",
                                                                    onPress: async () => {
                                                                        await deleteAllProducts();
                                                                        await clearSettings();
                                                                        DeviceEventEmitter.emit("hard_reset");
                                                                    }
                                                                }
                                                            ]
                                                        );
                                                    } else {
                                                        navigateTo(item.path);
                                                    }
                                                }}>
                                                    <View style={[stylec.iconBox, { backgroundColor: item.color + "25" }]}>
                                                        <MaterialIcons name={item.icon} size={normalize(22)} color={item.color} />
                                                    </View>
                                                    <View style={stylec.btnBody}>
                                                        <Text style={stylec.btnText}>{item.name}</Text>
                                                        <Text style={stylec.btnDesc}>{item.desc}</Text>
                                                    </View>
                                                    <View style={stylec.btnFooter}>
                                                        <MaterialIcons name="chevron-right" size={normalize(24)} color={theme().textMuted} />
                                                    </View>
                                                </TouchableOpacity>
                                                {i < section.items.length - 1 && <View style={stylec.divider} />}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </Animated.View>
            </View>
        </View>
    );
}
function get_stylec() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, paddingBottom: Platform.OS === "android" ? navBarHeight : 0 },
        header: { flex: 1, backgroundColor: "transparent", justifyContent: "center", alignItems: "center" },
        greetingsText: { fontSize: fontSize(6), fontFamily: "Poppins_600SemiBold", color: theme().text },
        body: { flex: 9, backgroundColor: theme().bg, marginBottom: normalize(navBarHeight) + normalize(20) },
        profileHeader: { marginBottom: normalize(20), marginTop: normalize(10), paddingHorizontal: normalize(5) },
        profileName: { fontSize: fontSize(7), fontFamily: "Poppins_600SemiBold", color: theme().text },
        profileSub: { fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, marginTop: normalize(-5) },
        section: { marginBottom: normalize(20) },
        sectionTitle: { fontSize: fontSize(3.2), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: normalize(8), marginLeft: normalize(10) },
        cardGroup: { backgroundColor: theme().cardBg, borderRadius: normalize(15), overflow: "hidden" },
        btn: { flexDirection: "row", paddingVertical: normalize(14), paddingHorizontal: normalize(15), alignItems: "center" },
        iconBox: { width: normalize(36), height: normalize(36), borderRadius: normalize(10), justifyContent: "center", alignItems: "center", marginRight: normalize(15) },
        btnBody: { flex: 1, justifyContent: "center" },
        btnText: { color: theme().text, fontFamily: "Poppins_600SemiBold", fontSize: fontSize(3.8), marginBottom: normalize(-2) },
        btnDesc: { color: theme().textMuted, fontFamily: "Poppins_600SemiBold", fontSize: fontSize(2.8) },
        btnFooter: { justifyContent: "center", alignItems: "flex-end" },
        divider: { height: 1, backgroundColor: theme().bg, marginLeft: normalize(60) }
    });
}