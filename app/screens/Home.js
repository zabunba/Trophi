import { theme, getThemeId } from "../assets/theme";
import { StyleSheet, View, Text, Platform, StatusBar, TouchableOpacity, ScrollView, Animated, DeviceEventEmitter } from "react-native";
import { t } from "../assets/lang";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { recordAppUsage } from "../dev";
import { Alert } from "react-native";

import { navBarHeight } from "../dev";
import { fontSize } from "../dev";
import { normalize } from "../dev";
import { fLetter } from "../dev";
import { howManyTime } from "../dev";
import { parseDate } from "../dev"; // needed for freshness calc
import { getProducts } from "../dev";
import { debugFireNow } from "../dev";
import { loadSettings, clearSettings } from "../dev";

export default function Home({ navigation }) {
    const stylec = get_stylec();

    const TIPS = [
        "NutriScore A & B products have at least 60% less saturated fat than average.",
        "Storing dairy at the back of the fridge (coldest spot) extends life by up to 3 days.",
        "Canned goods can last 2\u20135 years past their date if the can is undamaged.",
        "Freezing bread before expiry keeps it fresh for up to 3 months.",
        "Products with sugar listed in the first 3 ingredients are high-sugar by default.",
        "The 'best before' date is about quality, not safety \u2014 most foods are still fine after.",
        "Herbs last twice as long stored upright in a glass of water in the fridge.",
    ];

    const dailyTip = TIPS[new Date().getDate() % TIPS.length];
    const [fontsLoaded, error] = useFonts({
        Poppins_600SemiBold,
        Poppins_700Bold,
    });
    const [dataMin, setDataMin] = useState(undefined);

    const [userName, setUserName] = useState("");
    const [localThemeKey, setLocalThemeKey] = useState(0);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener("theme_changed", () => setLocalThemeKey(k => k + 1));
        return () => sub.remove();
    }, []);

    useEffect(() => {
        // track when the user actually opens the app
        const subscription = AppState.addEventListener("change", nextAppState => {
            if (nextAppState === "active") {
                recordAppUsage();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        loadSettings().then(s => setUserName(s.name ?? "user"));

        const unsubscribeFocus = navigation.addListener("focus", () => {
            loadSettings().then(s => setUserName(s.name ?? "user"));
        });

        return () => unsubscribeFocus();
    }, [navigation]);

    const isFetching = useRef(false);

    const handleResetApp = () => {
        Alert.alert(
            "Reset App Data?",
            "This will erase all your preferences, dietary settings, and return the app to its fresh state.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await clearSettings();
                    }
                }
            ]
        );
    };

    const loadData = () => {
        if (isFetching.current) return;
        isFetching.current = true;

        getProducts()
            .then(data => {
                setDataMin(data);
            })
            .catch(error => {
                console.error("[Home] Error loading data:", error);
            })
            .finally(() => {
                isFetching.current = false;
            });
    };


    useEffect(() => {
        // initial load
        loadData();

        // refresh when returning from another screen
        const unsubscribeFocus = navigation.addListener("focus", () => {
            loadData();
        });

        // refresh when the database shouts that it changed
        const dbListener = DeviceEventEmitter.addListener("db_changed", () => {
            loadData();
        });

        return () => {
            unsubscribeFocus();
            dbListener.remove();
        };
    }, [navigation]);


    const safeData = dataMin ?? [];
    const totalProducts = safeData.length;
    const lastItem = [...safeData].reverse()[0];
    const lastAdded = lastItem ? howManyTime(lastItem.validationDate) : "\u2014";
    const currentStreak = 1;

    // nutriscore calculation
    const goodNutriScores = safeData.filter(item =>
        ["a", "b"].includes(item.nutriScore?.toLowerCase())
    ).length;
    const nutriScorePercent = totalProducts > 0
        ? Math.round((goodNutriScores / totalProducts) * 100)
        : 0;

    // freshness status calculation
    let freshCount = 0;
    let soonCount = 0;
    let expiredCount = 0;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    safeData.forEach(item => {
        if (!item.validationDate) return;
        const target = parseDate(item.validationDate);
        const diffDays = Math.ceil((target - todayDate) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            expiredCount++;
        } else if (diffDays <= 7) {
            soonCount++; // expires in 7 days or less
        } else {
            freshCount++;
        }
    });

    // recently added (last 3 items)
    const recentItems = [...safeData].reverse().slice(0, 3);


    if (!fontsLoaded) return (
        <View style={{ justifyContent: "center", backgroundColor: theme().bg, flex: 1 }}>
            <Text style={{ color: theme().text, textAlign: "center" }}>{t("loading")}</Text>
        </View>
    );

    return (
        <View style={stylec.main}>
            <ExpoStatusBar style={getThemeId() === "light" ? "dark" : "light"} />
            <View style={stylec.header}>
                <Text style={[stylec.greetingsText, { color: theme().textMuted }]}>{t("good_morning")}</Text>
                <Text style={stylec.name}>{userName}</Text>
            </View>

            <View style={stylec.body}>
                {dataMin === undefined ? (
                    null
                ) : totalProducts === 0 ? (

                    <View style={stylec.emptyContent}>
                        <View style={{ alignItems: "center" }}>
                            <View>
                                <MaterialIcons name="area-chart" size={normalize(60)} color={theme().border} />
                            </View>
                        </View>
                        <Text style={stylec.emptyContentText}>{t("we_can_t_show_you_statistics")}</Text>
                        <Text style={stylec.emptyContentText}>{t("unless_we_have_a_product")}</Text>
                        <Text style={[stylec.emptyContentText, { marginTop: normalize(10) }]}>Go to {""}
                            <Text style={stylec.emptyContentLink} onPress={() => navigation.navigate("Insert")}>
                                Camera
                            </Text>
                        </Text>
                    </View>

                ) : (

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={stylec.tipCard}>
                            <View style={stylec.tipHeader}>
                                <MaterialIcons name="chat-bubble" size={normalize(14)} color={theme().primary} />
                                <Text style={stylec.tipLabel}>{t("did_you_know")}</Text>
                            </View>
                            <Text style={stylec.tipText}>{dailyTip}</Text>
                        </View>


                        <View style={stylec.stats}>
                            <Text style={stylec.headerText}>{t("inventory_summary")}</Text>
                            <View style={stylec.blocksView}>
                                <View style={[stylec.smallBlock, { backgroundColor: theme().cardBg, borderRadius: normalize(10), justifyContent: "center", alignItems: "center" }]}>
                                    <MaterialIcons name="cloud" size={normalize(24)} color={theme().primary} style={{ marginBottom: normalize(2) }} />
                                    <Text style={[stylec.numberBlock, { textTransform: "uppercase", fontSize: fontSize(8) }]}>{totalProducts}</Text>
                                    <Text style={[stylec.textBlock, { textTransform: "uppercase", marginTop: normalize(-5), textAlign: "center", paddingHorizontal: normalize(8), color: theme().textMuted }]}>{t("total_products")}</Text>
                                </View>
                                <View style={[stylec.smallBlock, { backgroundColor: theme().cardBg, borderRadius: normalize(10), justifyContent: "center", alignItems: "center" }]}>
                                    <MaterialIcons name="coffee" size={normalize(24)} color={theme().primary} style={{ marginBottom: normalize(2) }} />
                                    <Text style={[stylec.numberBlock, { textTransform: "uppercase", fontSize: fontSize(8) }]}>{nutriScorePercent}%</Text>
                                    <Text style={[stylec.textBlock, { textTransform: "uppercase", marginTop: normalize(-5), textAlign: "center", paddingHorizontal: normalize(8), color: theme().textMuted }]}>{t("nutriscore_a_b")}</Text>
                                </View>
                            </View>
                            <View style={stylec.blocksView}>
                                <View style={[stylec.smallBlock, { backgroundColor: expiredCount > 0 ? "rgba(229,57,53,0.15)" : theme().cardBg, borderRadius: normalize(10), justifyContent: "center", alignItems: "center", borderWidth: expiredCount > 0 ? 1 : 0, borderColor: "#e53935" }]}>
                                    <MaterialIcons name="warning" size={normalize(24)} color={expiredCount > 0 ? "#e53935" : theme().border} style={{ marginBottom: normalize(2) }} />
                                    <Text style={[stylec.numberBlock, { fontSize: fontSize(8), color: expiredCount > 0 ? "#e53935" : theme().text }]}>{expiredCount}</Text>
                                    <Text style={[stylec.textBlock, { textTransform: "uppercase", marginTop: normalize(-5), textAlign: "center", paddingHorizontal: normalize(8), color: theme().textMuted }]}>{t("expired")}</Text>
                                </View>
                                <View style={[stylec.smallBlock, { backgroundColor: soonCount > 0 ? "rgba(245,162,16,0.15)" : theme().cardBg, borderRadius: normalize(10), justifyContent: "center", alignItems: "center", borderWidth: soonCount > 0 ? 1 : 0, borderColor: "#f5a210" }]}>
                                    <MaterialIcons name="timelapse" size={normalize(24)} color={soonCount > 0 ? "#f5a210" : theme().border} style={{ marginBottom: normalize(2) }} />
                                    <Text style={[stylec.numberBlock, { fontSize: fontSize(8), color: soonCount > 0 ? "#f5a210" : theme().text }]}>{soonCount}</Text>
                                    <Text style={[stylec.textBlock, { textTransform: "uppercase", marginTop: normalize(-5), textAlign: "center", paddingHorizontal: normalize(8), color: theme().textMuted }]}>{t("exp_soon")}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[stylec.soon, { backgroundColor: "transparent" }]}>
                            <Text style={stylec.headerText}>{t("recently_added")}</Text>
                            <View style={[stylec.smallBlock, { backgroundColor: "transparent", paddingStart: normalize(5) }]}>
                                <View style={{ flex: 1, justifyContent: "center" }}>
                                    {recentItems.map((item, i) => (
                                        <View key={i} style={stylec.recentItemCard}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(10) }}>
                                                <View style={stylec.fLetterBox}>
                                                    <Text style={stylec.fLetterText}>{fLetter(item.name)}</Text>
                                                </View>
                                                <View>
                                                    <Text style={stylec.recentItemName} numberOfLines={1}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={stylec.recentItemCat}>
                                                        {item.category}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={stylec.recentItemTime}>
                                                {howManyTime(item.validationDate)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
function get_stylec() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, paddingBottom: Platform.OS === "android" ? navBarHeight : 0 },
        header: { flex: 1, backgroundColor: "transparent", justifyContent: "center", paddingStart: normalize(15), margin: normalize(2), gap: 0 },
        greetingsText: { fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", color: theme().text },
        name: { fontSize: fontSize(7), fontFamily: "Poppins_600SemiBold", color: theme().text },
        body: { flex: 9, margin: normalize(10), backgroundColor: "transparent", marginBottom: normalize(navBarHeight) + normalize(20) },
        stats: { marginBottom: normalize(6), backgroundColor: "transparent" },
        week: { marginBottom: normalize(6), backgroundColor: "transparent" },
        soon: { marginBottom: normalize(6), backgroundColor: "transparent" },
        headerText: { fontSize: fontSize(3.2), fontFamily: "Poppins_600SemiBold", color: theme().text, paddingStart: normalize(15) },
        blocksView: { flexDirection: "row", height: normalize(115) },
        smallBlock: { flex: 1, margin: normalize(5) },
        numberBlock: { fontSize: fontSize(10), fontFamily: "Poppins_600SemiBold", color: theme().text },
        textBlock: { fontSize: fontSize(2.8), fontFamily: "Poppins_600SemiBold", color: theme().text },
        freshnessBlock: { flex: 1, height: normalize(100), borderRadius: normalize(10), borderWidth: 1, alignItems: "center", justifyContent: "center", paddingVertical: normalize(10) },
        freshnessCount: { fontFamily: "Poppins_700Bold", fontSize: fontSize(6), marginTop: normalize(5), lineHeight: fontSize(7) },
        freshnessLabel: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(2.5), color: theme().text, textTransform: "uppercase" },
        recentItemCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: normalize(12), paddingVertical: normalize(10), marginBottom: normalize(10), backgroundColor: theme().cardBg, borderRadius: normalize(8) },
        fLetterBox: { width: normalize(30), height: normalize(30), backgroundColor: theme().primary + "25", borderRadius: normalize(5), alignItems: "center", justifyContent: "center" },
        fLetterText: { fontFamily: "Poppins_700Bold", fontSize: fontSize(4), color: theme().primary },
        recentItemName: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(3.5), color: theme().text, maxWidth: normalize(160) },
        recentItemCat: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(2.5), color: theme().textMuted },
        recentItemTime: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(3), color: theme().primary },
        emptyContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: normalize(5), marginTop: normalize(-50) },
        emptyContentText: { fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, textAlign: "center" },
        emptyContentLink: { color: theme().primary, textDecorationLine: "underline" },
        tipCard: { marginBottom: normalize(20), backgroundColor: theme().cardBg, borderRadius: normalize(12), padding: normalize(16), borderLeftWidth: 3, borderLeftColor: theme().primary },
        tipHeader: { flexDirection: "row", alignItems: "center", gap: normalize(6), marginBottom: normalize(8) },
        tipLabel: { fontSize: fontSize(2.5), fontFamily: "Poppins_600SemiBold", color: theme().primary, letterSpacing: 1 },
        tipText: { fontSize: fontSize(3.2), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, lineHeight: fontSize(5) }
    });
}