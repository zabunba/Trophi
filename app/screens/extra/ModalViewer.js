import { theme } from "../../assets/theme";
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from "react-native";
import { t } from "../../assets/lang";
import { Ionicons } from "@expo/vector-icons";
import { normalize } from "../../dev";
import { navBarHeight } from "../../dev";
import { fontSize } from "../../dev";
import { howManyTime } from "../../dev";
import { deleteProduct, updateProduct } from "../../dev";
import { useState, useEffect } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

const CATEGORIES = [
    "Proteins", "Dairy", "Vegetables", "Fruits",
    "Carbs", "Legumes", "Canned", "Frozen",
    "Condiments", "Snacks", "Drinks", "Prepared Meals",
    "Breakfast & Sweets", "Other"
];

const TYPES = [
    "Yogurt", "Cheese", "Butter", "Cream", "Milk",
    "Ketchup", "Mayonnaise", "Mustard", "Sauce",
    "Tomato", "Bread", "Egg", "Sugar", "Apple",
    "Potato", "Pasta", "Rice", "Chicken", "Beef",
    "Pork", "Fish", "Water", "Juice", "Coffee",
    "Tea", "Chocolate", "Biscuit", "Oil", "Beer", "Wine",
];

const NUTRISCORES = ["A", "B", "C", "D", "E"];

const NUTRISCORE_COLORS = {
    A: "#1a9e3f", B: "#8bc34a", C: "#f5c518", D: "#f5832a", E: "#e53935"
};

export default function ModalViewer({ visible, item, onClose }) {
    const stylec = get_stylec();

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({});
    const [dateError, setDateError] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // reset all state whenever the selected item changes so stale values
    // from a previous modal opening don't bleed into the next one
    useEffect(() => {
        setIsEditing(false);
        setForm({});
        setDateError(false);
        setShowDatePicker(false);
    }, [item?.id]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatInputDate = (isoString) => {
        if (!isoString) return "—";
        const parts = isoString.split("T");
        if (parts.length !== 2) return isoString;
        return `${parts[0]} ${parts[1].substring(0, 5)}`;
    };

    const timeConsumed = (inputDate, validationDate) => {
        if (!inputDate || !validationDate) return 0;
        const start = new Date(inputDate);
        const end = new Date(validationDate);
        const now = new Date();
        const total = end - start;
        if (total <= 0) return 100;
        return Math.min(100, Math.max(0, Math.round(((now - start) / total) * 100))) || 0;
    };

    const isValidDate = (str) => {
        if (!str || str.trim() === "") return true; // empty dates are fine

        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;

        const selected = new Date(str);
        selected.setHours(0, 0, 0, 0);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return !isNaN(selected) && selected >= now;
    };

    const formattedInputDate = formatInputDate(item?.inputDate);
    const consumedPercentage = timeConsumed(item?.inputDate, item?.validationDate);

    const openEdit = () => {
        // normalize stored values so chip comparisons are reliable
        const rawType = (item?.type ?? "").trim();
        const matchedType = TYPES.find(tp => tp.toLowerCase() === rawType.toLowerCase()) ?? rawType;
        const rawCategory = (item?.category ?? "").trim();
        const matchedCategory = CATEGORIES.find(c => c.toLowerCase() === rawCategory.toLowerCase()) ?? rawCategory;

        setForm({
            name:           item?.name ?? "",
            category:       matchedCategory,
            type:           matchedType,
            validationDate: item?.validationDate ?? "",
            units:          String(item?.units ?? 1),
            nutriscore:     item?.nutriScore?.toUpperCase() ?? "A",
        });
        setDateError(false);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setDateError(false);
    };

    const confirmEdit = async () => {
        if (!isValidDate(form.validationDate)) {
            setDateError(true);
            return;
        }
        await updateProduct(item.id, {
            ...form,
            units: parseInt(form.units) || 1,
            nutriscore: form.nutriscore.toLowerCase(),
        });
        setIsEditing(false);
        onClose();
    };

    const confirmDelete = () => {
        Alert.alert(
            "Delete product",
            `Are you sure you want to delete "${item?.name}"? This can't be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteProduct(item.id);
                        onClose();
                    },
                },
            ]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={stylec.overlay}>
                <View style={stylec.container}>

                    {/* header */}
                    <View style={stylec.header}>
                        <View style={stylec.headerIcon}>
                            <Text style={stylec.headerIconText}>{item?.name?.[0]}</Text>
                        </View>
                        <View style={stylec.headerInfo}>
                            <Text style={stylec.headerName}>{item?.name}</Text>
                            <Text style={stylec.headerSub}>{item?.category} • Added at {formattedInputDate}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={normalize(22)} color={theme().textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={stylec.divider} />

                    {isEditing ? (
                        /* edit form */
                        <ScrollView showsVerticalScrollIndicator={false} style={{ gap: normalize(14) }}>

                            <Text style={stylec.formLabel}>{t("name")}</Text>
                            <TextInput
                                style={stylec.formInput}
                                value={form.name}
                                onChangeText={val => setForm(f => ({ ...f, name: val }))}
                                placeholderTextColor={theme().border}
                                autoCapitalize="words"
                            />

                            <Text style={[stylec.formLabel, { marginTop: normalize(10) }]}>{t("expiry_date")}</Text>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(8) }}>
                                <TouchableOpacity
                                    style={[stylec.formInput, { flex: 1, borderColor: dateError ? "#e53935" : "transparent", borderWidth: dateError ? 1 : 0 }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={{ color: form.validationDate ? theme().text : theme().textMuted, fontFamily: "Poppins_600SemiBold" }}>
                                        {form.validationDate || "No expiry (optional)"}
                                    </Text>
                                </TouchableOpacity>
                                {form.validationDate ? (
                                    <TouchableOpacity style={{ padding: normalize(10) }} onPress={() => { setForm(f => ({ ...f, validationDate: "" })); setDateError(false); }}>
                                        <Ionicons name="close-circle" size={normalize(24)} color={theme().textMuted} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={
                                        form.validationDate
                                            ? new Date(form.validationDate)
                                            : today
                                    }
                                    mode="date"
                                    display="default"
                                    minimumDate={today}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);

                                        if (!selectedDate) return;

                                        const formatted =
                                            selectedDate.toISOString().split("T")[0];

                                        setForm(f => ({
                                            ...f,
                                            validationDate: formatted,
                                        }));

                                        setDateError(false);
                                    }}
                                />
                            )}

                            <Text style={[stylec.formLabel, { marginTop: normalize(10) }]}>{t("units")}</Text>
                            <View style={stylec.unitsRow}>
                                <TouchableOpacity
                                    style={stylec.unitsBtn}
                                    onPress={() => setForm(f => ({ ...f, units: String(Math.max(1, parseInt(f.units) - 1)) }))}
                                >
                                    <Ionicons name="remove" size={normalize(18)} color={theme().text} />
                                </TouchableOpacity>
                                <TextInput
                                    style={stylec.unitsInput}
                                    value={form.units}
                                    onChangeText={val => setForm(f => ({ ...f, units: val.replace(/[^0-9]/g, "") }))}
                                    keyboardType="numeric"
                                    textAlign="center"
                                />
                                <TouchableOpacity
                                    style={stylec.unitsBtn}
                                    onPress={() => setForm(f => ({ ...f, units: String(parseInt(f.units) + 1) }))}
                                >
                                    <Ionicons name="add" size={normalize(18)} color={theme().text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[stylec.formLabel, { marginTop: normalize(10) }]}>{t("nutriscore")}</Text>
                            <View style={stylec.nutriRow}>
                                {NUTRISCORES.map(score => (
                                    <TouchableOpacity
                                        key={score}
                                        style={[
                                            stylec.nutriBtn,
                                            { backgroundColor: form.nutriscore === score ? NUTRISCORE_COLORS[score] : theme().cardBg }
                                        ]}
                                        onPress={() => setForm(f => ({ ...f, nutriscore: score }))}
                                    >
                                        <Text style={[
                                            stylec.nutriBtnText,
                                            { color: form.nutriscore === score ? theme().text : theme().textMuted }
                                        ]}>{score}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[stylec.formLabel, { marginTop: normalize(10) }]}>{t("category")}</Text>
                            <View style={stylec.chipGrid}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            stylec.chip,
                                            form.category === cat && stylec.chipActive
                                        ]}
                                        onPress={() => setForm(f => ({ ...f, category: cat }))}
                                    >
                                        <Text style={[
                                            stylec.chipText,
                                            form.category === cat && stylec.chipTextActive
                                        ]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[stylec.formLabel, { marginTop: normalize(10) }]}>{t("type")}</Text>
                            <View style={stylec.chipGrid}>
                                {TYPES.map(tp => (
                                    <TouchableOpacity
                                        key={tp}
                                        style={[
                                            stylec.chip,
                                            form.type === tp && stylec.chipActive
                                        ]}
                                        onPress={() => setForm(f => ({ ...f, type: tp }))}
                                    >
                                        <Text style={[
                                            stylec.chipText,
                                            form.type === tp && stylec.chipTextActive
                                        ]}>{tp}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={[stylec.actions, { marginTop: normalize(16), marginBottom: normalize(8) }]}>
                                <TouchableOpacity style={stylec.btnSecondary} onPress={cancelEdit}>
                                    <Text style={stylec.btnSecondaryText}>{t("cancel_1")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={stylec.btnGreen} onPress={confirmEdit}>
                                    <Text style={stylec.btnGreenText}>{t("confirm")}</Text>
                                </TouchableOpacity>
                            </View>

                        </ScrollView>
                    ) : (
                        /* view mode */
                        <>
                            <View style={stylec.expiresCard}>
                                <Text style={stylec.expiresLabel}>{t("expires")}</Text>
                                <Text style={stylec.expiresValue}>{howManyTime(item?.validationDate)}</Text>
                                <Text style={stylec.expiresDate}>{item?.validationDate}</Text>
                                <View style={stylec.progressBar}>
                                    <View style={[stylec.progressFill, { width: `${consumedPercentage}%` }]} />
                                </View>
                                <Text style={stylec.progressLabel}>{consumedPercentage}% Time consumed toward expiry</Text>
                            </View>

                            <Text style={stylec.sectionTitle}>{t("details")}</Text>
                            <View style={stylec.detailsGrid}>
                                {[
                                    { label: "QUANTITY",   value: `${item?.units} UNITS` },
                                    { label: "CATEGORY",   value: item?.category },
                                    { label: "TYPE",       value: item?.type },
                                    { label: "NUTRISCORE", value: item?.nutriScore?.toUpperCase() ?? "—" },
                                    { label: "ADDED ON",   value: formattedInputDate },
                                ].map(({ label, value }) => (
                                    <View key={label} style={stylec.detailCell}>
                                        <Text style={stylec.detailCellLabel}>{label}</Text>
                                        <Text style={stylec.detailCellValue}>{value}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={stylec.actions}>
                                <TouchableOpacity style={stylec.btnGreen} onPress={openEdit}>
                                    <Text style={stylec.btnGreenText}>{t("edit")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={stylec.btnDelete} onPress={confirmDelete}>
                                    <Text style={stylec.btnDeleteText}>{t("delete")}</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                </View>
            </View>
        </Modal>
    );
}

function get_stylec() { 
    return StyleSheet.create({
        overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
        container: { backgroundColor: theme().inputBg, borderTopLeftRadius: normalize(20), borderTopRightRadius: normalize(20), padding: normalize(20), paddingBottom: normalize(navBarHeight) + normalize(20), maxHeight: "90%", gap: normalize(14) },
        header: { flexDirection: "row", alignItems: "center", gap: normalize(12) },
        headerIcon: { width: normalize(44), height: normalize(44), borderRadius: normalize(8), backgroundColor: theme().cardBg, justifyContent: "center", alignItems: "center" },
        headerIconText: { fontSize: fontSize(5), fontFamily: "Poppins_600SemiBold", color: theme().text },
        headerInfo: { flex: 1 },
        headerName: { fontSize: fontSize(5), fontFamily: "Poppins_600SemiBold", color: theme().text },
        headerSub: { fontSize: fontSize(2.5), fontFamily: "Poppins_600SemiBold", color: theme().textMuted },
        divider: { height: 1, backgroundColor: theme().cardBg },
        expiresCard: { backgroundColor: theme().cardBg, borderRadius: normalize(12), padding: normalize(16), gap: normalize(4) },
        expiresLabel: { fontSize: fontSize(2.2), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, letterSpacing: 1 },
        expiresValue: { fontSize: fontSize(7), fontFamily: "Poppins_600SemiBold", color: theme().text },
        expiresDate: { fontSize: fontSize(2.5), fontFamily: "Poppins_600SemiBold", color: theme().textMuted },
        progressBar: { height: normalize(4), backgroundColor: theme().border, borderRadius: normalize(4), marginTop: normalize(8) },
        progressFill: { height: "100%", backgroundColor: theme().text, borderRadius: normalize(4) },
        progressLabel: { fontSize: fontSize(2.2), fontFamily: "Poppins_600SemiBold", color: theme().textMuted },
        sectionTitle: { fontSize: fontSize(2.5), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, letterSpacing: 1 },
        detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: normalize(8) },
        detailCell: { width: "47%", backgroundColor: theme().cardBg, borderRadius: normalize(10), padding: normalize(12), gap: normalize(4) },
        detailCellLabel: { fontSize: fontSize(2), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, letterSpacing: 0.8 },
        detailCellValue: { fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", color: theme().text },
        formLabel: { fontSize: fontSize(2.2), fontFamily: "Poppins_600SemiBold", color: theme().textMuted, letterSpacing: 0.8, marginBottom: normalize(5) },
        formInput: { backgroundColor: theme().cardBg, borderRadius: normalize(8), padding: normalize(12), fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold", color: theme().text },
        formInputError: { borderWidth: 1, borderColor: "#e53935" },
        errorText: { fontSize: fontSize(2.5), fontFamily: "Poppins_600SemiBold", color: "#e53935", marginTop: normalize(4) },
        unitsRow: { flexDirection: "row", alignItems: "center", backgroundColor: theme().cardBg, borderRadius: normalize(8), overflow: "hidden" },
        unitsBtn: { padding: normalize(12), alignItems: "center", justifyContent: "center", backgroundColor: theme().cardBg, width: normalize(44) },
        unitsInput: { flex: 1, fontSize: fontSize(4), fontFamily: "Poppins_600SemiBold", color: theme().text, paddingVertical: normalize(10) },
        nutriRow: { flexDirection: "row", gap: normalize(8) },
        nutriBtn: { flex: 1, paddingVertical: normalize(10), borderRadius: normalize(8), alignItems: "center" },
        nutriBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(4) },
        chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: normalize(8) },
        chip: { paddingHorizontal: normalize(12), paddingVertical: normalize(8), backgroundColor: theme().cardBg, borderRadius: normalize(20) },
        chipActive: { backgroundColor: theme().primary },
        chipText: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(2.8), color: theme().textMuted },
        chipTextActive: { color: theme().inputBg },
        actions: { flexDirection: "row", gap: normalize(8) },
        btnSecondary: { flex: 1, backgroundColor: theme().cardBg, borderRadius: normalize(10), padding: normalize(14), alignItems: "center" },
        btnSecondaryText: { fontFamily: "Poppins_600SemiBold", color: theme().text, fontSize: fontSize(3) },
        btnGreen: { flex: 1, backgroundColor: theme().primary, borderRadius: normalize(10), padding: normalize(14), alignItems: "center" },
        btnGreenText: { fontFamily: "Poppins_600SemiBold", color: theme().inputBg, fontSize: fontSize(3) },
        btnDelete: { flex: 1, backgroundColor: "#e53935", borderRadius: normalize(10), padding: normalize(14), alignItems: "center" },
        btnDeleteText: { fontFamily: "Poppins_600SemiBold", color: theme().text, fontSize: fontSize(3) },
    });
}