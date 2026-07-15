import { theme } from "../../assets/theme";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { t } from "../../assets/lang";
import { Ionicons } from "@expo/vector-icons";
import { normalize } from "../../dev";
import { navBarHeight } from "../../dev";
import { fontSize } from "../../dev";
import { useState } from "react";

const TYPES = [
    "Yogurt", "Cheese", "Butter", "Cream", "Milk",
    "Ketchup", "Mayonnaise", "Mustard", "Sauce",
    "Tomato", "Bread", "Egg", "Sugar", "Apple",
    "Potato", "Pasta", "Rice", "Chicken", "Beef",
    "Pork", "Fish", "Water", "Juice", "Coffee",
    "Tea", "Chocolate", "Biscuit", "Oil", "Beer", "Wine",
];

const EXPIRY_OPTIONS = [
    { id: "exp1", label: "Expired", days: 0 },
    { id: "exp2", label: "< 7 days", days: 7 },
    { id: "exp3", label: "< 30 days", days: 30 },
    { id: "exp4", label: "< 3 months", days: 90 },
    { id: "exp5", label: "< 6 months", days: 180 },
    { id: "exp6", label: "< 1 year", days: 365 },
];

const SORT_OPTIONS = [
    { id: "sort1", label: "Expiry \u2191" },
    { id: "sort2", label: "Expiry \u2193" },
    { id: "sort3", label: "Name A-Z" },
    { id: "sort4", label: "Name Z-A" },
    { id: "sort5", label: "Units \u2191" },
    { id: "sort6", label: "Units \u2193" },
];

const NUTRI_OPTIONS = ["A", "B", "C", "D", "E"];

export default function ModalFilter({ visible, onClose, onApply }) {
    const stylec = get_stylec();

    const [types, setTypes] = useState([]);
    const [expiry, setExpiry] = useState(null);
    const [sort, setSort] = useState(null);
    const [nutriScore, setNutriScore] = useState([]);

    const toggleType = (name) =>
        setTypes(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);

    const toggleNutri = (n) =>
        setNutriScore(prev => prev.includes(n) ? prev.filter(c => c !== n) : [...prev, n]);

    const clear = () => {
        setTypes([]);
        setExpiry(null);
        setSort(null);
        setNutriScore([]);
    };

    const apply = () => {
        onApply?.({ types, expiry, sort, nutriScore });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={stylec.overlay}>
                <View style={stylec.container}>

                    <View style={stylec.header}>
                        <Text style={stylec.title}>{t("filters")}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={normalize(22)} color={theme().textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={stylec.divider} />

                    <ScrollView showsVerticalScrollIndicator={false} style={{ gap: normalize(14) }}>

                        <Text style={stylec.sectionLabel}>{t("sort_by")}</Text>
                        <View style={stylec.pillsGrid}>
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.id}
                                    onPress={() => setSort(prev => prev === opt.id ? null : opt.id)}
                                    style={[stylec.pill, sort === opt.id && stylec.pillActive]}
                                >
                                    <Text style={[stylec.pillText, sort === opt.id && stylec.pillTextActive]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={stylec.divider} />

                        <Text style={stylec.sectionLabel}>{t("expires_in")}</Text>
                        <View style={stylec.pillsGrid}>
                            {EXPIRY_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.id}
                                    onPress={() => setExpiry(prev => prev === opt.id ? null : opt.id)}
                                    style={[stylec.pill, expiry === opt.id && stylec.pillActive]}
                                >
                                    <Text style={[stylec.pillText, expiry === opt.id && stylec.pillTextActive]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={stylec.divider} />

                        <Text style={stylec.sectionLabel}>{t("type") || "Type"}</Text>
                        <View style={stylec.pillsGrid}>
                            {TYPES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => toggleType(cat)}
                                    style={[stylec.pill, types.includes(cat) && stylec.pillActive]}
                                >
                                    <Text style={[stylec.pillText, types.includes(cat) && stylec.pillTextActive]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={stylec.divider} />

                        <Text style={stylec.sectionLabel}>{t("nutriscore")}</Text>
                        <View style={stylec.pillsGrid}>
                            {NUTRI_OPTIONS.map(n => (
                                <TouchableOpacity
                                    key={n}
                                    onPress={() => toggleNutri(n)}
                                    style={[stylec.pill, stylec.pillSquare, nutriScore.includes(n) && stylec.pillActive]}
                                >
                                    <Text style={[stylec.pillText, nutriScore.includes(n) && stylec.pillTextActive]}>
                                        {n}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                    </ScrollView>

                    <View style={stylec.divider} />

                    <View style={stylec.actions}>
                        <TouchableOpacity onPress={clear} style={stylec.btnClear}>
                            <Text style={stylec.btnClearText}>{t("clear")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={apply} style={stylec.btnApply}>
                            <Text style={stylec.btnApplyText}>{t("apply")}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

function get_stylec() {
    return StyleSheet.create({
        overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
        container: { backgroundColor: theme().inputBg, borderTopLeftRadius: normalize(20), borderTopRightRadius: normalize(20), padding: normalize(20), paddingBottom: normalize(navBarHeight) + normalize(20), maxHeight: "90%", gap: normalize(14) },
        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        title: { fontSize: fontSize(5), fontFamily: "Poppins_600SemiBold", color: theme().text },
        divider: { height: 1, backgroundColor: theme().cardBg },
        sectionLabel: { fontSize: fontSize(2.5), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, letterSpacing: 1, marginTop: normalize(10), marginBottom: normalize(4) },
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
    });
}