import { theme } from "../../assets/theme";
import React, { useEffect } from "react";
import { t } from "../../assets/lang";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { MaterialIcons } from "@expo/vector-icons";
import { normalize } from "../../dev";
import { fontSize } from "../../dev";

export default function AboutApp({ backProp, titleChange }) {
    const stylec = get_stylec();

    const [fontsLoaded] = useFonts({ Poppins_600SemiBold });

    useEffect(() => {
        if (titleChange) titleChange(t("about"));
        return () => {
            if (titleChange) titleChange(t("settings"));
        };
    }, []);

    if (!fontsLoaded) return null;

    return (
        <View style={stylec.main}>
            <TouchableOpacity onPress={() => backProp()} style={stylec.backBtn}>
                <MaterialIcons name={"arrow-back-ios"} size={normalize(20)} color={theme().text} />
            </TouchableOpacity>

            <ScrollView style={stylec.scroll} showsVerticalScrollIndicator={false}>

                <View style={stylec.brandingContainer}>
                    <View style={stylec.iconPlaceholder}>
                        <Image
                            source={require("../../assets/adaptive-icon.png")}
                            style={stylec.appIcon}
                            resizeMode="cover"
                        />
                    </View>
                    <Text style={stylec.appName}>{t("trophi")}</Text>
                    <Text style={stylec.appVersion}>{t("version_beta_1_0")}</Text>
                </View>

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("project_info")}</Text>

                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("developer")}</Text>
                        <Text style={stylec.infoValue}>{t("rafael_sousa")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("project_type")}</Text>
                        <Text style={stylec.infoValue}>{t("semi_open_source")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("build_date")}</Text>
                        <Text style={stylec.infoValue}>{t("30_june_2026")}</Text>
                    </View>
                </View>

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("requirements_info_worst_case")}</Text>

                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("processor")}</Text>
                        <Text style={stylec.infoValue}>{t("quad_core_1_2ghz")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("os")}</Text>
                        <Text style={stylec.infoValue}>{t("android_10_0")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("ram")}</Text>
                        <Text style={stylec.infoValue}>{t("3gb")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("rom")}</Text>
                        <Text style={stylec.infoValue}>{t("32gb")}</Text>
                    </View>
                </View>

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("building_info")}</Text>

                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("platform")}</Text>
                        <Text style={stylec.infoValue}>{t("expo_react_native")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("target_os")}</Text>
                        <Text style={stylec.infoValue}>{t("android_10_0_90")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("database")}</Text>
                        <Text style={stylec.infoValue}>{t("sqlite_local")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("compute_vision")}</Text>
                        <Text style={stylec.infoValue}>{t("google_ml_kit")}</Text>
                    </View>
                </View>

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("contributors")}</Text>
                    <Text style={stylec.paragraph}>{t("special_thanks_people_who_made_it_possib")}</Text>

                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("lead_developer")}</Text>
                        <Text style={stylec.infoValue}>{t("rafael_sousa")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("ui_ux_design")}</Text>
                        <Text style={stylec.infoValue}>{t("rafael_sousa")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("databases_scrap")}</Text>
                        <Text style={stylec.infoValue}>{t("rafael_sousa")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("product_database")}</Text>
                        <Text style={stylec.infoValue}>{t("open_food_facts")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("recipe_database")}</Text>
                        <Text style={stylec.infoValue}>{t("recipenlg")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("prototype_design_analist")}</Text>
                        <Text style={stylec.infoValue}>{t("joana_cardoso_rafael_sousa")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("prototype_database_analist")}</Text>
                        <Text style={stylec.infoValue}>{t("rafael_sousa")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("lead_prototype_analist")}</Text>
                        <Text style={stylec.infoValue}>{t("rafael_sousa")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("prototype_analist")}</Text>
                        <Text style={stylec.infoValue}>{t("lurdes_sousa")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("coordinator_professor")}</Text>
                        <Text style={stylec.infoValue}>{t("henrique_teixeira")}</Text>
                    </View>
                    <View style={stylec.infoRow}>
                        <Text style={stylec.infoLabel}>{t("evaluation_institute")}</Text>
                        <Text style={stylec.infoValue}>{t("ispgaya")}</Text>
                    </View>
                </View>

                <Text style={stylec.footerText}>{t("developed_to_combat_domestic_food_waste_")}</Text>

            </ScrollView>
        </View>
    );
}
function get_stylec() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: normalize(20), paddingHorizontal: normalize(16) },
        backBtn: { marginBottom: normalize(10) },
        scroll: { flex: 1 },
        paragraph: { color: theme().textMuted, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", marginBottom: normalize(15), lineHeight: normalize(20) },
        brandingContainer: { alignItems: "center", marginVertical: normalize(20) },
        iconPlaceholder: { width: normalize(90), height: normalize(90), borderRadius: normalize(20), backgroundColor: theme().text, justifyContent: "center", alignItems: "center", marginBottom: normalize(15), shadowColor: theme().primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
        appIcon: { width: normalize(90), height: normalize(90), borderRadius: normalize(20) },
        appName: { color: theme().text, fontSize: fontSize(6), fontFamily: "Poppins_600SemiBold" },
        appVersion: { color: theme().textMuted, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", marginTop: normalize(2) },
        card: { backgroundColor: theme().cardBg, borderRadius: normalize(12), padding: normalize(15), marginBottom: normalize(20) },
        subTitle: { color: theme().text, fontSize: fontSize(4.5), fontFamily: "Poppins_600SemiBold", marginBottom: normalize(10) },
        infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: normalize(8) },
        infoLabel: { color: theme().textMuted, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold" },
        infoValue: { color: theme().text, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", textAlign: "right", flex: 1, paddingLeft: normalize(10) },
        linkRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: normalize(12) },
        borderBottom: { borderBottomWidth: 1, borderBottomColor: theme().border },
        linkText: { color: theme().text, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold" },
        footerText: { color: theme().textMuted, fontSize: fontSize(3), fontFamily: "Poppins_600SemiBold", textAlign: "center", marginTop: normalize(10), marginBottom: normalize(30) }
    });
}