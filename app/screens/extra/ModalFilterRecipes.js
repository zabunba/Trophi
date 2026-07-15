import { theme } from "../../assets/theme";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { t } from "../../assets/lang";
import { Ionicons } from "@expo/vector-icons";
import { normalize } from "../../dev";
import { navBarHeight } from "../../dev";
import { fontSize } from "../../dev";
import { useState } from "react";

const NUTRI_OPTIONS = ["A", "B", "C", "D", "E", "F"];

const INGREDIENT_TYPES = [
    "Milk", "Sugar", "Chicken", "Beef", "Pork", "Fish",
    "Butter/Margarine", "Oil/Olive Oil", "Cheese", "Tomato",
    "Potato", "Rice", "Pasta", "Apple", "Chocolate",
    "Egg", "Bread", "Yogurt", "Biscuit/Cookie", "Water",
    "Juice", "Coffee", "Tea",
];

const SORT_OPTIONS = [
    { id: "sort1", label: "Name A-Z" },
    { id: "sort2", label: "Name Z-A" },
    { id: "sort3", label: "NutriScore \u2191" },
    { id: "sort4", label: "NutriScore \u2193" },
];

export default function ModalFilterRecipes({ visible, onClose, onApply }) {
    const s = get_s();

    const [nutriScore,       setNutriScore]       = useState([]);
    const [ingredientTypes,  setIngredientTypes]  = useState([]);
    const [sort,             setSort]             = useState(null);

    const toggle = (list, setList, val) =>
        setList(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

    const clear = () => {
        setNutriScore([]);
        setIngredientTypes([]);
        setSort(null);
    };

    const apply = () => {
        onApply?.({ nutriScore, ingredientTypes, sort });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.overlay}>
                <View style={s.container}>

                    <View style={s.header}>
                        <Text style={s.title}>{t("filter_recipes")}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={normalize(22)} color={theme().textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={s.divider} />

                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* sort */}
                        <Text style={s.sectionLabel}>{t("sort_by")}</Text>
                        <View style={s.pillsGrid}>
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.id}
                                    onPress={() => setSort(prev => prev === opt.id ? null : opt.id)}
                                    style={[s.pill, sort === opt.id && s.pillActive]}
                                >
                                    <Text style={[s.pillText, sort === opt.id && s.pillTextActive]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={s.divider} />

                        {/* nutriscore */}
                        <Text style={s.sectionLabel}>{t("nutriscore")}</Text>
                        <View style={s.pillsGrid}>
                            {NUTRI_OPTIONS.map(n => (
                                <TouchableOpacity
                                    key={n}
                                    onPress={() => toggle(nutriScore, setNutriScore, n)}
                                    style={[s.pill, s.pillSquare, nutriScore.includes(n) && s.pillActive]}
                                >
                                    <Text style={[s.pillText, nutriScore.includes(n) && s.pillTextActive]}>
                                        {n}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={s.divider} />

                        {/* ingredient types */}
                        <Text style={s.sectionLabel}>{t("contains")}</Text>
                        <View style={s.pillsGrid}>
                            {INGREDIENT_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => toggle(ingredientTypes, setIngredientTypes, t)}
                                    style={[s.pill, ingredientTypes.includes(t) && s.pillActive]}
                                >
                                    <Text style={[s.pillText, ingredientTypes.includes(t) && s.pillTextActive]}>
                                        {t}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                    </ScrollView>

                    <View style={s.divider} />

                    <View style={s.actions}>
                        <TouchableOpacity onPress={clear} style={s.btnClear}>
                            <Text style={s.btnClearText}>{t("clear")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={apply} style={s.btnApply}>
                            <Text style={s.btnApplyText}>{t("apply")}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}
function get_s() { return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    container: { backgroundColor: theme().inputBg, borderTopLeftRadius: normalize(20), borderTopRightRadius: normalize(20), padding: normalize(20), paddingBottom: normalize(navBarHeight) + normalize(20), maxHeight: "90%", gap: normalize(14) },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: fontSize(5), fontFamily: "Poppins_600SemiBold", color: theme().text },
    divider: { height: 1, backgroundColor: theme().cardBg },
    sectionLabel: { fontSize: fontSize(2.5), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, letterSpacing: 1, marginTop: normalize(10), marginBottom: normalize(8) },
    pillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: normalize(8), marginBottom: normalize(10) },
    pill: { paddingHorizontal: normalize(12), paddingVertical: normalize(6), borderRadius: normalize(20), backgroundColor: theme().cardBg, borderWidth: 1, borderColor: theme().cardBg },
    pillSquare: { paddingHorizontal: normalize(16), borderRadius: normalize(8) },
    pillActive: { backgroundColor: theme().text, borderColor: theme().text },
    pillText: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(2.8), color: theme().textMuted },
    pillTextActive: { color: theme().bg },
    actions: { flexDirection: "row", gap: normalize(8) },
    btnClear: { flex: 1, padding: normalize(14), borderRadius: normalize(10), backgroundColor: theme().cardBg, alignItems: "center" },
    btnClearText: { fontFamily: "Poppins_600SemiBold", color: theme().textMuted, fontSize: fontSize(3) },
    btnApply: { flex: 2, padding: normalize(14), borderRadius: normalize(10), backgroundColor: theme().text, alignItems: "center" },
    btnApplyText: { fontFamily: "Poppins_600SemiBold", color: theme().bg, fontSize: fontSize(3) },
}); }