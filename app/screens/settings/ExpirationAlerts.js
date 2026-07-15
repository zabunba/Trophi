import { theme } from "../../assets/theme";
import { useState, useEffect } from "react";
import { t } from "../../assets/lang";
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Modal, Alert } from "react-native";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { MaterialIcons } from "@expo/vector-icons";
import { normalize } from "../../dev";
import { fontSize } from "../../dev";
import { loadSettings, patchSettings, getSmartIntervals } from "../../dev";

const ITEM_HEIGHT = normalize(45);
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const MINUTES = ["00", "30"];
const PERIODS = ["AM", "PM"];

const DEFAULT_INTERVALS = [
    { id: "1", start: "08:00 AM", end: "10:00 AM" },
    { id: "2", start: "12:00 PM", end: "02:00 PM" },
    { id: "3", start: "06:00 PM", end: "10:00 PM" },
];

const CustomScrollPicker = ({ data, selectedValue, onValueChange }) => {
    const stylec = get_stylec();
    const initialIndex = data.indexOf(selectedValue) >= 0 ? data.indexOf(selectedValue) : 0;
    return (
        <View style={stylec.pickerColumn}>
            <View style={stylec.selectionHighlight} pointerEvents="none" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (data[index]) onValueChange(data[index]);
                }}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
            >
                {data.map((item, index) => (
                    <View key={index} style={stylec.pickerItem}>
                        <Text style={stylec.pickerItemText}>{item}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default function NotificationSettings({ backProp, titleChange }) {
    const stylec = get_stylec();

    const [fontsLoaded] = useFonts({ Poppins_600SemiBold });

    const [isAutoEnabled, setIsAutoEnabled] = useState(true);
    const [customIntervals, setCustomIntervals] = useState(DEFAULT_INTERVALS);
    const [smartIntervals, setSmartIntervals] = useState(DEFAULT_INTERVALS);

    const [pickerConfig, setPickerConfig] = useState({
        visible: false, intervalId: null, type: null, hour: "08", minute: "00", period: "AM"
    });

    useEffect(() => {
        if (titleChange) titleChange(t("alert_settings"));
        loadSettings().then(s => {
            setIsAutoEnabled(s.smartNotifications ?? true);
            setCustomIntervals(s.customIntervals ?? DEFAULT_INTERVALS);

            // calculate smart intervals from user behavior data
            const smart = getSmartIntervals(s.usageHistogram);
            setSmartIntervals(smart && smart.length > 0 ? smart : DEFAULT_INTERVALS);
        });
        return () => { if (titleChange) titleChange(t("settings")); };
    }, []);

    const toggleAutoSwitch = () => {
        setIsAutoEnabled(prev => {
            patchSettings({ smartNotifications: !prev });
            return !prev;
        });
    };

    const addInterval = () => {
        const newInterval = { id: Date.now().toString(), start: "12:00 PM", end: "12:30 PM" };
        setCustomIntervals(prev => {
            const next = [...prev, newInterval];
            patchSettings({ customIntervals: next });
            return next;
        });
    };

    const removeInterval = (id) => {
        setCustomIntervals(prev => {
            const next = prev.filter(i => i.id !== id);
            patchSettings({ customIntervals: next });
            return next;
        });
    };

    const openCustomPicker = (id, type, currentTimeStr) => {
        const [timeMatch, periodMatch] = currentTimeStr.split(" ");
        const [hourMatch, minuteMatch] = timeMatch.split(":");
        setPickerConfig({ visible: true, intervalId: id, type, hour: hourMatch, minute: minuteMatch, period: periodMatch });
    };

    const saveTime = () => {
        const newTimeStr = `${pickerConfig.hour}:${pickerConfig.minute} ${pickerConfig.period}`;

        const currentInterval = customIntervals.find(i => i.id === pickerConfig.intervalId);
        if (currentInterval) {
            const startStr = pickerConfig.type === "start" ? newTimeStr : currentInterval.start;
            const endStr = pickerConfig.type === "end" ? newTimeStr : currentInterval.end;

            const toMins = (ts) => {
                const [time, p] = ts.split(" ");
                let [h, m] = time.split(":").map(Number);
                if (p === "PM" && h !== 12) h += 12;
                if (p === "AM" && h === 12) h = 0;
                return h * 60 + m;
            };

            if (toMins(startStr) >= toMins(endStr)) {
                Alert.alert("Invalid Time", "Start time must be before end time.");
                return;
            }
        }

        setCustomIntervals(prev => {
            const next = prev.map(item =>
                item.id === pickerConfig.intervalId
                    ? { ...item, [pickerConfig.type]: newTimeStr }
                    : item
            );
            patchSettings({ customIntervals: next });
            return next;
        });
        setPickerConfig(prev => ({ ...prev, visible: false }));
    };

    if (!fontsLoaded) return null;

    // show smart or custom intervals depending on mode
    const displayedIntervals = isAutoEnabled ? smartIntervals : customIntervals;

    return (
        <View style={stylec.main}>
            <TouchableOpacity onPress={() => backProp()} style={stylec.backBtn}>
                <MaterialIcons name="arrow-back-ios" size={normalize(20)} color={theme().text} />
            </TouchableOpacity>

            <ScrollView style={stylec.scroll} showsVerticalScrollIndicator={false}>

                <View style={stylec.card}>
                    <View style={stylec.row}>
                        <View style={stylec.textContainer}>
                            <Text style={stylec.subTitle}>{t("smart_notifications")}</Text>
                            <Text style={stylec.paragraph}>{t("automatic_mode_targets_the_highest_movem")}</Text>
                        </View>
                        <Switch
                            trackColor={{ false: theme().border, true: theme().primary }}
                            thumbColor={isAutoEnabled ? theme().text : theme().textMuted}
                            onValueChange={toggleAutoSwitch}
                            value={isAutoEnabled}
                        />
                    </View>
                </View>

                <View style={[stylec.card, isAutoEnabled && stylec.disabledCard]}>
                    <Text style={stylec.subTitle}>
                        {isAutoEnabled ? "Smart Peak Hours" : "Custom Peak Hours"}
                    </Text>
                    <Text style={[stylec.paragraph, isAutoEnabled && stylec.disabledText]}>
                        {isAutoEnabled
                            ? "Based on your app usage patterns, we've detected your most active times."
                            : "Set multiple custom time frames."}
                    </Text>

                    {displayedIntervals.map((interval) => (
                        <View key={interval.id} style={stylec.intervalBlock}>
                            <View style={stylec.timeSelectRow}>
                                <TouchableOpacity
                                    disabled={isAutoEnabled}
                                    style={[stylec.timeButton, isAutoEnabled && stylec.disabledButton]}
                                    onPress={() => openCustomPicker(interval.id, "start", interval.start)}
                                >
                                    <Text style={[stylec.timeValue, isAutoEnabled && stylec.disabledText]}>
                                        {interval.start}
                                    </Text>
                                </TouchableOpacity>

                                <Text style={[stylec.toText, isAutoEnabled && stylec.disabledText]}>{t("to")}</Text>

                                <TouchableOpacity
                                    disabled={isAutoEnabled}
                                    style={[stylec.timeButton, isAutoEnabled && stylec.disabledButton]}
                                    onPress={() => openCustomPicker(interval.id, "end", interval.end)}
                                >
                                    <Text style={[stylec.timeValue, isAutoEnabled && stylec.disabledText]}>
                                        {interval.end}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {!isAutoEnabled && (
                                <TouchableOpacity
                                    onPress={() => removeInterval(interval.id)}
                                    style={stylec.removeButton}
                                >
                                    <Text style={stylec.removeText}>{t("x")}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    {!isAutoEnabled && (
                        <TouchableOpacity onPress={addInterval} style={stylec.addButton}>
                            <Text style={stylec.addText}>{t("add_time_block")}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: normalize(40) }} />
            </ScrollView>

            <Modal
                transparent
                visible={pickerConfig.visible}
                animationType="slide"
                onRequestClose={() => setPickerConfig(prev => ({ ...prev, visible: false }))}
            >
                <View style={stylec.modalOverlay}>
                    <View style={stylec.modalBox}>
                        <Text style={stylec.modalTitle}>{t("set_time")}</Text>

                        <View style={stylec.wheelContainer}>
                            <CustomScrollPicker
                                data={HOURS}
                                selectedValue={pickerConfig.hour}
                                onValueChange={(val) => setPickerConfig(prev => ({ ...prev, hour: val }))}
                            />
                            <Text style={stylec.colon}>:</Text>
                            <CustomScrollPicker
                                data={MINUTES}
                                selectedValue={pickerConfig.minute}
                                onValueChange={(val) => setPickerConfig(prev => ({ ...prev, minute: val }))}
                            />
                            <View style={{ width: normalize(10) }} />
                            <CustomScrollPicker
                                data={PERIODS}
                                selectedValue={pickerConfig.period}
                                onValueChange={(val) => setPickerConfig(prev => ({ ...prev, period: val }))}
                            />
                        </View>

                        <View style={stylec.modalActions}>
                            <TouchableOpacity onPress={() => setPickerConfig(prev => ({ ...prev, visible: false }))}>
                                <Text style={stylec.cancelText}>{t("cancel")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveTime} style={stylec.saveButton}>
                                <Text style={stylec.saveText}>{t("save")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function get_stylec() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: normalize(20), paddingHorizontal: normalize(16) },
        backBtn: { marginBottom: normalize(10) },
        scroll: { flex: 1 },
        subTitle: { color: theme().text, fontSize: fontSize(4.5), fontFamily: "Poppins_600SemiBold", marginBottom: normalize(5) },
        paragraph: { color: theme().textMuted, fontSize: fontSize(3), fontFamily: "Poppins_600SemiBold", lineHeight: normalize(22), marginBottom: normalize(10) },
        card: { backgroundColor: theme().cardBg, borderRadius: normalize(12), padding: normalize(15), marginBottom: normalize(20) },
        row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        textContainer: { flex: 1, paddingRight: normalize(10) },
        disabledCard: { opacity: 0.4 },
        intervalBlock: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme().bg, padding: normalize(10), borderRadius: normalize(8), marginBottom: normalize(10) },
        timeSelectRow: { flexDirection: "row", alignItems: "center", flex: 1 },
        timeButton: { backgroundColor: theme().border, paddingVertical: normalize(8), paddingHorizontal: normalize(12), borderRadius: normalize(6) },
        timeValue: { color: theme().text, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold" },
        toText: { color: theme().textMuted, marginHorizontal: normalize(8), fontSize: fontSize(3), fontFamily: "Poppins_600SemiBold" },
        removeButton: { padding: normalize(8) },
        removeText: { color: "#ff5252", fontSize: fontSize(4), fontFamily: "Poppins_600SemiBold" },
        addButton: { marginTop: normalize(5), paddingVertical: normalize(12), backgroundColor: theme().border, borderRadius: normalize(8), alignItems: "center" },
        addText: { color: theme().primary, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold" },
        disabledText: { color: theme().textMuted },
        disabledButton: { backgroundColor: theme().cardBg },
        modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
        modalBox: { backgroundColor: theme().cardBg, borderTopLeftRadius: normalize(20), borderTopRightRadius: normalize(20), padding: normalize(20), paddingBottom: normalize(40) },
        modalTitle: { color: theme().text, fontSize: fontSize(4.5), fontFamily: "Poppins_600SemiBold", textAlign: "center", marginBottom: normalize(20) },
        wheelContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", height: ITEM_HEIGHT * 3, marginBottom: normalize(20) },
        pickerColumn: { width: normalize(60), height: "100%" },
        selectionHighlight: { position: "absolute", top: ITEM_HEIGHT, width: "100%", height: ITEM_HEIGHT, backgroundColor: theme().border, borderRadius: normalize(8) },
        pickerItem: { height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" },
        pickerItemText: { color: theme().text, fontSize: fontSize(5), fontFamily: "Poppins_600SemiBold" },
        colon: { color: theme().text, fontSize: fontSize(6), fontFamily: "Poppins_600SemiBold", marginHorizontal: normalize(5), marginBottom: normalize(5) },
        modalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: normalize(10) },
        cancelText: { color: theme().textMuted, fontSize: fontSize(4), fontFamily: "Poppins_600SemiBold", padding: normalize(10) },
        saveButton: { backgroundColor: theme().primary, paddingVertical: normalize(12), paddingHorizontal: normalize(30), borderRadius: normalize(8) },
        saveText: { color: theme().inputBg, fontSize: fontSize(4), fontFamily: "Poppins_600SemiBold" },
    });
}