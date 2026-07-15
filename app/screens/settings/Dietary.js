import { theme } from "../../assets/theme";
import { useState, useEffect, useCallback } from "react";
import { t } from "../../assets/lang";
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView } from "react-native";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { MaterialIcons } from "@expo/vector-icons";
import { normalize } from "../../dev";
import { fontSize } from "../../dev";
import { loadSettings, patchSettings } from "../../dev";

const DIET_PROFILES = [
    { id: "none", label: "No Specific Diet" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "keto", label: "Keto" },
    { id: "paleo", label: "Paleo" },
];

const ALLERGIES = [
    { id: "dairy", label: "Dairy-Free (Lactose)" },
    { id: "gluten", label: "Gluten-Free (Celiac)" },
    { id: "nuts", label: "Nut-Free (Peanuts/Tree Nuts)" },
    { id: "shellfish", label: "Shellfish-Free" },
    { id: "eggs", label: "Egg-Free" },
    { id: "soy", label: "Soy-Free" },
];

export default function DietaryPreferences({ backProp, titleChange }) {
    const stylec = get_stylec();

    const [fontsLoaded] = useFonts({ Poppins_600SemiBold });
    const [activeDiet, setActiveDiet] = useState("none");
    const [activeAllergies, setActiveAllergies] = useState({
        dairy: false, gluten: false, nuts: false, shellfish: false, eggs: false, soy: false,
    });

    useEffect(() => {
        if (titleChange) titleChange(t("dietary_preferences"));
        loadSettings().then(s => {
            setActiveDiet(s.diet ?? "none");
            setActiveAllergies(prev => ({ ...prev, ...(s.allergies ?? {}) }));
        });
        return () => { if (titleChange) titleChange(t("settings")); };
    }, []);

    const selectDiet = (id) => {
        setActiveDiet(id);
        patchSettings({ diet: id });
    };

    const toggleAllergy = (id) => {
        setActiveAllergies(prev => {
            const next = { ...prev, [id]: !prev[id] };
            patchSettings({ allergies: next });
            return next;
        });
    };

    if (!fontsLoaded) return null;

    return (
        <View style={stylec.main}>
            <TouchableOpacity onPress={() => backProp()} style={stylec.backBtn}>
                <MaterialIcons name="arrow-back-ios" size={normalize(20)} color={theme().text} />
            </TouchableOpacity>

            <ScrollView style={stylec.scroll} showsVerticalScrollIndicator={false}>

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("diet_profile")}</Text>
                    <Text style={stylec.paragraph}>{t("select_your_primary_eating_pattern_to_fi")}</Text>
                    <View style={stylec.listContainer}>
                        {DIET_PROFILES.map((diet, i) => (
                            <TouchableOpacity
                                key={diet.id}
                                style={[stylec.radioOption, i !== DIET_PROFILES.length - 1 && stylec.borderBottom]}
                                onPress={() => selectDiet(diet.id)}
                            >
                                <Text style={stylec.optionText}>{diet.label}</Text>
                                <View style={stylec.radioOuter}>
                                    {activeDiet === diet.id && <View style={stylec.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={stylec.card}>
                    <Text style={stylec.subTitle}>{t("allergies_intolerances")}</Text>
                    <Text style={stylec.paragraph}>{t("we_will_strictly_exclude_recipes_contain")}</Text>
                    <View style={stylec.listContainer}>
                        {ALLERGIES.map((allergy, i) => (
                            <View
                                key={allergy.id}
                                style={[stylec.switchRow, i !== ALLERGIES.length - 1 && stylec.borderBottom]}
                            >
                                <Text style={stylec.optionText}>{allergy.label}</Text>
                                <Switch
                                    trackColor={{ false: theme().border, true: theme().primary }}
                                    thumbColor={activeAllergies[allergy.id] ? theme().text : theme().textMuted}
                                    onValueChange={() => toggleAllergy(allergy.id)}
                                    value={activeAllergies[allergy.id]}
                                />
                            </View>
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
        switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: normalize(10) },
        optionText: { color: theme().text, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", flex: 1, paddingRight: normalize(10) },
    });
}