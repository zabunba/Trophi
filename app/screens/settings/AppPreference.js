import { theme } from "../../assets/theme";
import { useState, useEffect } from "react";
import { t, setLanguage } from "../../assets/lang";
import { setTheme } from "../../assets/theme";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { MaterialIcons } from "@expo/vector-icons";
import { normalize } from "../../dev";
import { fontSize } from "../../dev";
import { loadSettings, patchSettings } from "../../dev";

const LANGUAGES = [
    { id: "en", label: "English" },
    // { id: "pt", label: "Português" },  // disabled — recipes are EN only
    // { id: "fr", label: "Français" },   // disabled — recipes are EN only
];

const THEMES = [
    { id: "light", label: "Light Mode" },
    { id: "dark", label: "Dark Mode" },
    { id: "intense_dark", label: "Intense Dark Mode" },
    { id: "sunrise", label: "Sunrise Theme" },
    { id: "sunset", label: "Sunset Theme" },
];

export default function AppPreferences({ backProp, titleChange }) {
    const stylec = get_stylec();

    const [fontsLoaded] = useFonts({ Poppins_600SemiBold });
    const [activeLanguage, setActiveLanguage] = useState("pt");
    const [activeTheme, setActiveTheme] = useState("dark");
    const [userName, setUserName] = useState("user");

    useEffect(() => {
        if (titleChange) titleChange(t("app_preferences"));
        loadSettings().then(s => {
            setActiveTheme(s.appearance ?? "dark");
            setUserName(s.name ?? "");

            // force english
            /*
            const currentLang = s.language ?? "en";
            if (currentLang !== "en") {
                patchSettings({ language: "en" });
                setLanguage("en");
                setActiveLanguage("en");
            } else {
                setActiveLanguage(currentLang);
            }
            */
            setActiveLanguage("en");
        });
        return () => { if (titleChange) titleChange(t("settings")); };
    }, []);

    /*
    const selectLanguage = (id) => {
        setActiveLanguage(id);
        patchSettings({ language: id });
        setLanguage(id);
    };
    */
    const selectTheme = (id) => {
        setActiveTheme(id);
        patchSettings({ appearance: id });
        setTheme(id);
    };
    const onNameBlur = () => patchSettings({ name: userName });

    if (!fontsLoaded) return null;

    return (
        <View style={stylec.main}>
            <TouchableOpacity onPress={() => backProp()} style={stylec.backBtn}>
                <MaterialIcons name="arrow-back-ios" size={normalize(20)} color={theme().text} />
            </TouchableOpacity>

            <ScrollView style={stylec.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("profile")}</Text>
                    <Text style={stylec.paragraph}>{t("how_would_you_like_the_app_to_call_you")}</Text>
                    <View style={stylec.inputContainer}>
                        <MaterialIcons name="person" size={normalize(20)} color={theme().textMuted} style={stylec.inputIcon} />
                        <TextInput
                            style={stylec.textInput}
                            value={userName}
                            onChangeText={setUserName}
                            onBlur={onNameBlur}
                            placeholder="Enter your name"
                            placeholderTextColor={theme().textMuted}
                            selectionColor={theme().primary}
                        />
                    </View>
                </View>

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("language")}</Text>
                    <Text style={stylec.paragraph}>{t("choose_the_primary_language_for_the_app_")}</Text>
                    <View style={stylec.listContainer}>
                        {LANGUAGES.map((lang, i) => (
                            <TouchableOpacity
                                key={lang.id}
                                style={[stylec.radioOption, i !== LANGUAGES.length - 1 && stylec.borderBottom]}
                                onPress={() => { /* selectLanguage(lang.id) is disabled */ }}
                            >
                                <Text style={stylec.optionText}>{lang.label}</Text>
                                <View style={stylec.radioOuter}>
                                    {/*activeLanguage === lang.id && */}<View style={stylec.radioInner} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("appearance")}</Text>
                    <Text style={stylec.paragraph}>{t("select_your_preferred_visual_theme")}</Text>
                    <View style={stylec.listContainer}>
                        {THEMES.map((theme, i) => (
                            <TouchableOpacity
                                key={theme.id}
                                style={[stylec.radioOption, i !== THEMES.length - 1 && stylec.borderBottom]}
                                onPress={() => selectTheme(theme.id)}
                            >
                                <Text style={stylec.optionText}>{theme.label}</Text>
                                <View style={stylec.radioOuter}>
                                    {activeTheme === theme.id && <View style={stylec.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>


                <View style={{ height: normalize(40) }} />
            </ScrollView>
        </View>
    );
}

function get_stylec() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: normalize(20), paddingHorizontal: normalize(16) },
        backBtn: { marginBottom: normalize(10) },
        scroll: { flex: 1 },
        card: { backgroundColor: theme().cardBg, borderRadius: normalize(12), padding: normalize(15), marginBottom: normalize(20) },
        subTitle: { color: theme().text, fontSize: fontSize(4.5), fontFamily: "Poppins_600SemiBold", marginBottom: normalize(5) },
        paragraph: { color: theme().textMuted, fontSize: fontSize(3), fontFamily: "Poppins_600SemiBold", lineHeight: normalize(22), marginBottom: normalize(15) },
        listContainer: { backgroundColor: theme().bg, borderRadius: normalize(8), paddingHorizontal: normalize(10) },
        radioOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: normalize(12) },
        borderBottom: { borderBottomWidth: 1, borderBottomColor: theme().cardBg },
        radioOuter: { height: normalize(20), width: normalize(20), borderRadius: normalize(10), borderWidth: 2, borderColor: theme().primary, justifyContent: "center", alignItems: "center" },
        radioInner: { height: normalize(10), width: normalize(10), borderRadius: normalize(5), backgroundColor: theme().primary },
        optionText: { color: theme().text, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", flex: 1, paddingRight: normalize(10) },
        inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: theme().bg, borderRadius: normalize(8), paddingHorizontal: normalize(12), height: normalize(45) },
        inputIcon: { marginRight: normalize(10) },
        textInput: { flex: 1, color: theme().text, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", height: "100%" },
    });
}