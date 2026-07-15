import { theme, getThemeId } from "../assets/theme";
import { StyleSheet, View, Text, Platform, StatusBar, TextInput, TouchableOpacity, Button, ScrollView, DeviceEventEmitter } from "react-native";
import { t } from "../assets/lang";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { MaterialIcons } from "@expo/vector-icons";
import { Animated } from "react-native";
import { useEffect, useRef, useState } from "react";

import { navBarHeight } from "../dev";
import { fontSize } from "../dev";
import { normalize } from "../dev";
import { fLetter } from "../dev";
import { howManyTime } from "../dev";
import { parseDate } from "../dev";
import ModalViewer from "./extra/ModalViewer";
import ModalFilter from "./extra/ModalFilter";

import { getProducts, generateNoiseData, deleteAllProducts } from "../dev";

export default function Home({ navigation }) {
    const stylec = get_stylec();

    const [fontsLoaded, error] = useFonts({
        Poppins_600SemiBold,
        Poppins_700Bold,
    });
    const [localThemeKey, setLocalThemeKey] = useState(0);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener("theme_changed", () => setLocalThemeKey(k => k + 1));
        return () => sub.remove();
    }, []);
    const [dataMin, setDataMin] = useState(undefined);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [filterVisible, setFilterVisible] = useState(null);
    const [activeFilters, setActiveFilters] = useState({
        types: [],
        expiry: null,
        sort: null,
        nutriScore: [],
    });

    const loadData = () => {
        getProducts().then(data => {
            setDataMin(data);
        });
    };

    useEffect(() => {
        loadData();

        const unsubscribeFocus = navigation.addListener("focus", () => {
            loadData();
        });

        const dbListener = DeviceEventEmitter.addListener("db_changed", () => {
            loadData();
        });

        return () => {
            unsubscribeFocus();
            dbListener.remove();
        };
    }, [navigation]);

    const handleAddNoise = async () => {
        await generateNoiseData(5);
    };

    const handleClearData = async () => {
        await deleteAllProducts();
    };

    const expiryMap = {
        exp1: 0, exp2: 7, exp3: 30, exp4: 90, exp5: 180, exp6: 365,
    };

    const filteredData = [...(dataMin ?? [])]
        .filter(item => {
            if (!item.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

            if (activeFilters?.types?.length > 0 && !activeFilters.types.includes(item.type)) return false;

            if (activeFilters?.nutriScore?.length > 0) {
                const itemScore = String(item.nutriscore || item.nutriScore || "").toUpperCase();

                const targetScores = activeFilters.nutriScore.map(s => String(s).toUpperCase());

                if (!targetScores.includes(itemScore)) return false;
            }

            if (activeFilters?.expiry) {
                const maxDays = expiryMap[activeFilters.expiry];
                const today = new Date();
                const diffDays = Math.ceil((parseDate(item.validationDate) - today) / (1000 * 60 * 60 * 24));

                if (activeFilters.expiry === "exp1") {
                    if (diffDays >= 0) return false;
                } else {
                    if (diffDays < 0) return false;
                    if (diffDays > maxDays) return false;
                }
            }
            return true;
        })
        .sort((a, b) => {
            switch (activeFilters?.sort) {
                case "sort1": return parseDate(a.validationDate) - parseDate(b.validationDate);
                case "sort2": return parseDate(b.validationDate) - parseDate(a.validationDate);
                case "sort3": return a.name.localeCompare(b.name);
                case "sort4": return b.name.localeCompare(a.name);
                case "sort5": return a.units - b.units;
                case "sort6": return b.units - a.units;
                default: return 0;
            }
        });

    if (!fontsLoaded) return (
        <View style={{ justifyContent: "center", backgroundColor: theme().textMuted, flex: 1 }}>
            <Text>{t("loading")}</Text>
        </View>
    );

    return (
        <View style={stylec.main}>
            <ExpoStatusBar style={getThemeId() === "light" ? "dark" : "light"} />

            {dataMin !== undefined ? (
                <>
                    <View style={stylec.header}>
                        <Text style={stylec.greetingsText}>{t("your_products")}</Text>

                        {/*
                        <View style={stylec.testButtonsContainer}>
                            <TouchableOpacity style={[stylec.testBtn, { backgroundColor: theme().primary }]} onPress={handleAddNoise}>
                                <Text style={stylec.testBtnText}>{t("add_noise")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[stylec.testBtn, { backgroundColor: "#f5105a" }]} onPress={handleClearData}>
                                <Text style={stylec.testBtnText}>{t("clear_db")}</Text>
                            </TouchableOpacity>
                        </View>
                        */}

                    </View>
                    <View style={stylec.body}>

                        {dataMin.length === 0 ? (
                            <View style={stylec.emptyContent}>
                                <View style={{ alignItems: "center" }}>
                                    <View>
                                        <MaterialIcons name="smartphone" size={normalize(60)} color={theme().border} />
                                    </View>
                                </View>
                                <Text style={stylec.emptyContentText}>{t("no_products_found")}</Text>
                                <Text style={stylec.emptyContentText}>Add content via {""}
                                    <Text style={stylec.emptyContentLink} onPress={() => navigation.navigate("Insert")}>
                                        Camera
                                    </Text>
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={stylec.headerBody}>
                                    <View style={stylec.bodyBar}>
                                        <View style={stylec.bbBar}>
                                            <MaterialIcons name="search" size={normalize(20)} color={theme().textMuted} />
                                            <TextInput
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                placeholder="Search products..."
                                                placeholderTextColor={theme().textMuted}
                                                style={stylec.bbInputBar}
                                            />
                                            {searchQuery.length > 0 && (
                                                <MaterialIcons
                                                    name="close"
                                                    size={normalize(20)}
                                                    color={theme().textMuted}
                                                    onPress={() => setSearchQuery("")}
                                                />
                                            )}
                                            <TouchableOpacity onPress={() => setFilterVisible(true)} style={stylec.filterIconBtn}>
                                                <MaterialIcons name="view-headline" size={normalize(20)} color={theme().text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {filteredData.length === 0 ? (
                                    <View style={[stylec.emptyContent, { marginTop: 0 }]}>
                                        <MaterialIcons name="search" size={normalize(50)} color={theme().border} />
                                        <Text style={stylec.emptyContentText}>{t("no_matching_products")}</Text>
                                    </View>
                                ) : (
                                    <ScrollView style={stylec.normalBody} contentContainerStyle={{ paddingBottom: normalize(20) }}>
                                        {filteredData.map((item, i) => (
                                            <View key={item.id} style={stylec.itemV}>
                                                <TouchableOpacity onPress={() => setSelectedItem(item)} style={stylec.itemVButton}>
                                                    <View style={stylec.itemVHeader}>
                                                        <View style={stylec.itemVHeaderIcon}>
                                                            <Text style={stylec.itemVHeaderIconText}>
                                                                {fLetter(item.name)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View style={stylec.itemVBody}>
                                                        <View style={stylec.itemVBodyProductName}>
                                                            <Text style={stylec.itemVBodyProductNameText} numberOfLines={1}>
                                                                {item.name}
                                                            </Text>
                                                        </View>
                                                        <View style={stylec.itemVBodyProductInf}>
                                                            <Text style={stylec.itemVBodyProductInfText}>
                                                                {item.type} - {item.units} Units
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View style={stylec.itemVFooter}>
                                                        <View style={stylec.itemVFooterIC}>
                                                            <Text style={stylec.itemVFooterICText}>
                                                                {howManyTime(item.validationDate)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </>
                        )}
                    </View>
                </>
            ) : null}

            <ModalViewer
                visible={selectedItem !== null}
                item={selectedItem}
                onClose={() => {
                    setSelectedItem(null);
                    loadData();
                }}
            />
            <ModalFilter
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                onApply={(filters) => setActiveFilters(filters)}
            />
        </View>
    );
}
function get_stylec() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, paddingBottom: Platform.OS === "android" ? navBarHeight : 0 },
        header: { flex: 1, backgroundColor: "transparent", justifyContent: "center", alignItems: "center" },
        greetingsText: { fontSize: fontSize(6), fontFamily: "Poppins_600SemiBold", color: theme().text },
        testButtonsContainer: { flexDirection: "row", gap: normalize(10), marginTop: normalize(5) },
        testBtn: { paddingHorizontal: normalize(15), paddingVertical: normalize(5), borderRadius: normalize(5) },
        testBtnText: { fontFamily: "Poppins_600SemiBold", color: theme().bg, fontSize: fontSize(3) },
        body: { flex: 9, backgroundColor: "transparent", marginBottom: normalize(navBarHeight) + normalize(20) },
        headerBody: { flex: 0.15, backgroundColor: "transparent", marginRight: normalize(5), marginLeft: normalize(5) },
        normalBody: { flex: 0.75, backgroundColor: "transparent" },
        bodyBar: { flex: 1, backgroundColor: "transparent", marginBottom: normalize(5), margin: normalize(10) },
        filterIconBtn: { justifyContent: "center", alignItems: "center" },
        bbBar: { backgroundColor: theme().cardBg + "aa", justifyContent: "center", alignItems: "center", flex: 1, flexDirection: "row", paddingHorizontal: normalize(12), borderRadius: normalize(8) },
        bbInputBar: { color: theme().text, fontFamily: "Poppins_600SemiBold", fontSize: fontSize(3.5), paddingVertical: normalize(10), flex: 1, marginHorizontal: normalize(8) },
        itemV: { height: normalize(50), margin: normalize(10), backgroundColor: "transparent", flexDirection: "row" },
        itemVButton: { width: "100%", height: "100%", flexDirection: "row" },
        itemVHeader: { flex: 0.2, backgroundColor: "transparent" },
        itemVHeaderIcon: { flex: 1, borderRadius: normalize(5), margin: normalize(3), backgroundColor: theme().primary + "33", borderWidth: 1, borderColor: theme().primary + "55", alignItems: "center", justifyContent: "center" },
        itemVHeaderIconText: { fontSize: fontSize(5), fontFamily: "Poppins_600SemiBold", color: theme().primary },
        itemVBody: { flex: 0.55, backgroundColor: "transparent" },
        itemVBodyProductName: { flex: 0.6, backgroundColor: "transparent", paddingStart: normalize(10), justifyContent: "center" },
        itemVBodyProductNameText: { fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", color: theme().text },
        itemVBodyProductInf: { flex: 0.4, backgroundColor: "transparent", paddingStart: normalize(10), justifyContent: "center" },
        itemVBodyProductInfText: { fontSize: fontSize(2.5), fontFamily: "Poppins_600SemiBold", color: theme().textMuted },
        itemVFooter: { flex: 0.25, backgroundColor: "transparent" },
        itemVFooterIC: { flex: 1, backgroundColor: theme().primary, borderRadius: normalize(12), margin: normalize(6), justifyContent: "center", alignItems: "center" },
        itemVFooterICText: { color: theme().bg, fontSize: fontSize(2.5), fontFamily: "Poppins_700Bold" },
        emptyContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: normalize(12), marginTop: normalize(-50) },
        emptyContentText: { fontSize: fontSize(3), fontFamily: "Poppins_600SemiBold", color: theme().textMuted },
        emptyContentLink: { color: theme().primary, textDecorationLine: "underline" }
    });
}